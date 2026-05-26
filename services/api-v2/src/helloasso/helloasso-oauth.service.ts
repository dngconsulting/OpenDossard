import { BadGatewayException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { truncate } from '../common/utils/string.util';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoStateStore } from './helloasso-state.store';
import { generatePkcePair, generateState } from './util/pkce.util';

/** Marge avant expiration pour renouveler le token partenaire en cache (secondes). */
const PARTNER_TOKEN_EXPIRY_MARGIN_SECONDS = 60;

/**
 * Service OAuth2 + PKCE pour la mire d'autorisation HelloAsso.
 *
 * Modèle de liaison : **HelloAsso est la source de vérité** pour savoir de
 * quelle association le user est admin. OpenDossard ne porte pas la relation
 * user ↔ club admin en base. Le flux est donc :
 *
 *   1. `prepareAuthorization({ userId })`
 *      → génère PKCE + state, stocke `(userId, codeVerifier)` côté store,
 *        retourne `authorizeUrl` à ouvrir côté front (popup / full-page).
 *      → on ne connaît PAS encore le club cible.
 *
 *   2. (Le user s'authentifie sur HelloAsso, choisit son asso, autorise.
 *       HelloAsso redirige vers redirect_uri?code=...&state=...)
 *
 *   3. `consumeCallback({ code, state })`
 *      → restitue `(userId, codeVerifier)` depuis le state store
 *      → le state lui-même EST la preuve d'identité (random 256-bit, single-use,
 *        TTL court, server-side store). Pas besoin d'authentifier le callback :
 *        seul un user authentifié a pu créer le mapping via `prepareAuthorization`.
 *      → POST /oauth2/token avec authorization_code
 *      → retourne `{ userId, organizationSlug, tokens }`. C'est le
 *        `organizationSlug` qui désigne le club à lier — le caller fait
 *        ensuite le matching slug → ClubEntity en base, et utilise `userId`
 *        pour l'audit (`linked_by_user_id`).
 *
 *   4. `getPartnerAccessToken()`
 *      → token partenaire (`client_credentials`) pour agir sur les orgas qui ont
 *        autorisé le partenaire (checkout, lecture d'intent), indépendamment du
 *        token OAuth par asso.
 */
@Injectable()
export class HelloAssoOAuthService {
  private readonly logger = new Logger(HelloAssoOAuthService.name);

  /**
   * Cache in-memory du token partenaire (`client_credentials`). Partner-wide
   * (pas par club) : un seul token couvre tous les appels partenaire. Renouvelé
   * dès qu'on entre dans la marge d'expiration (cf. {@link getPartnerAccessToken}).
   */
  private partnerTokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private readonly config: HelloAssoConfig,
    private readonly stateStore: HelloAssoStateStore,
  ) {}

  prepareAuthorization(input: {
    userId: number;
    userEmail: string;
    originClubId?: number;
  }): PreparedAuthorization {
    const { codeVerifier, codeChallenge } = generatePkcePair();
    const state = generateState();

    this.stateStore.put(state, {
      userId: input.userId,
      codeVerifier,
      originClubId: input.originClubId ?? null,
    });

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    this.logger.log(
      `prepareAuthorization: mire demandée par userId=${input.userId} email=${input.userEmail}`,
    );

    return {
      authorizeUrl: `${this.config.authorizeEndpoint}?${params.toString()}`,
      state,
    };
  }

  /**
   * Échange l'authorization_code contre des tokens HelloAsso après lookup du state.
   *
   * **Sécurité** : le state est la preuve d'identité — il a été émis par
   * `prepareAuthorization` (endpoint JWT-protected) avec un binding serveur
   * `state → userId`. Random 256-bit + single-use + TTL court ⇒ inforgeable
   * et non-rejouable. Le callback n'a donc pas besoin d'être authentifié.
   *
   * Le `organizationSlug` retourné par HelloAsso identifie l'asso à laquelle
   * le user a accordé l'accès — c'est cette valeur qui sert de pont vers
   * l'entité Club côté OpenDossard. Le matching se fait sur `elicenceName`
   * slugifié (ex: "CYCLO CLUB CASTANEEN" → "cyclo-club-castaneen") — pas de
   * colonne dédiée pour l'instant. Le caller (controller) est responsable
   * du matching et de la persistance des tokens contre le bon club.
   */
  async consumeCallback(input: { code: string; state: string }): Promise<CallbackResult> {
    const entry = this.stateStore.consume(input.state);

    const tokens = await this.exchangeAuthorizationCode(input.code, entry.codeVerifier);

    if (!tokens.organizationSlug) {
      // Cas anormal — l'échange authorization_code DOIT retourner un slug
      // (c'est le seul lien vers l'asso choisie par le user). Si HelloAsso
      // omet ce champ, on n'a aucun moyen de relier la liaison à un club.
      this.logger.error(`consumeCallback: missing organization_slug in HelloAsso token response`);
      throw new BadGatewayException('HelloAsso did not return an organization slug');
    }

    return {
      userId: entry.userId,
      organizationSlug: tokens.organizationSlug,
      originClubId: entry.originClubId,
      tokens,
    };
  }

  /**
   * Consomme le state sans throw — utilisé par les branches d'erreur du callback
   * (errorParam d'HelloAsso, missing_params) pour récupérer `originClubId` et
   * rediriger sur la fiche du club d'origine plutôt que `/clubs`. Single-use
   * préservé : la ligne est retirée du store, ce qui empêche un replay du state
   * sur un appel callback ultérieur.
   *
   * Retourne `null` si state absent, inconnu, ou expiré.
   */
  tryConsumeForError(state: string | undefined): { originClubId: number | null } | null {
    if (!state) return null;
    try {
      const entry = this.stateStore.consume(state);
      return { originClubId: entry.originClubId };
    } catch {
      return null;
    }
  }

  /**
   * Token partenaire via le flux OAuth2 `client_credentials`.
   *
   * Sert à agir sur les organisations qui ont autorisé le partenaire (création
   * de checkout-intents, lecture de paiements) **sans dépendre du token OAuth
   * par asso** : ce dernier expire (refresh 30 j) et peut être « cassé », alors
   * que l'autorisation org → partenaire persiste côté HelloAsso. Le `clientId`
   * partenaire doit avoir le privilège `Checkout` activé.
   *
   * Mis en cache in-memory et renouvelé dès qu'on entre dans une marge de 60 s
   * avant l'expiration (évite d'utiliser un token au bord de l'invalidation).
   * La réponse `client_credentials` ne porte ni `refresh_token` ni
   * `organization_slug` — seuls `access_token` + `expires_in` sont exploités.
   */
  async getPartnerAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.partnerTokenCache && now < this.partnerTokenCache.expiresAt) {
      return this.partnerTokenCache.token;
    }

    const tokens = await this.postToken({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    this.partnerTokenCache = {
      token: tokens.accessToken,
      expiresAt: now + (tokens.expiresIn - PARTNER_TOKEN_EXPIRY_MARGIN_SECONDS) * 1000,
    };
    return tokens.accessToken;
  }

  private async exchangeAuthorizationCode(
    code: string,
    codeVerifier: string,
  ): Promise<HelloAssoTokens> {
    return this.postToken({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      code_verifier: codeVerifier,
      // `redirect_uri` en clair dans le body (URLSearchParams ré-encode lui-même)
      redirect_uri: this.config.redirectUri,
    });
  }

  private async postToken(body: Record<string, string>): Promise<HelloAssoTokens> {
    const params = new URLSearchParams(body);
    let response: Response;
    try {
      response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (e) {
      this.logger.error(
        `postToken: network error to ${this.config.tokenEndpoint}`,
        e instanceof Error ? e.stack : String(e),
      );
      throw new BadGatewayException('HelloAsso token endpoint unreachable');
    }

    if (!response.ok) {
      const bodyText = await safeReadText(response);
      this.logger.warn(
        `postToken: HelloAsso ${response.status} ${response.statusText} body=${truncate(bodyText, 300)}`,
      );
      // 400/401 = client_id/secret/code/verifier KO → UnauthorizedException
      // 5xx ou autre = panne HelloAsso → BadGateway pour distinguer côté ops
      if (response.status >= 400 && response.status < 500) {
        throw new UnauthorizedException('HelloAsso rejected the token request');
      }
      throw new BadGatewayException('HelloAsso token endpoint failed');
    }

    const data = (await response.json()) as RawHelloAssoTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn:
        typeof data.expires_in === 'string' ? parseInt(data.expires_in, 10) : data.expires_in,
      organizationSlug: data.organization_slug,
    };
  }
}

export interface PreparedAuthorization {
  authorizeUrl: string;
  state: string;
}

export interface CallbackResult {
  userId: number;
  /**
   * Slug de l'asso HelloAsso à laquelle le user vient d'accorder l'accès.
   * À matcher avec `ClubEntity.helloAssoSlug` (saisie manuelle côté caller).
   */
  organizationSlug: string;
  /**
   * Club depuis lequel le user a initié la mire (côté SPA). Sert au controller
   * pour rediriger sur la fiche club d'origine en cas d'erreur. NULL si la
   * mire a été initiée hors contexte club.
   */
  originClubId: number | null;
  tokens: HelloAssoTokens;
}

export interface HelloAssoTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  /** Présent lors de la liaison initiale (authorization_code) et au refresh. */
  organizationSlug?: string;
}

interface RawHelloAssoTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number | string;
  organization_slug?: string;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable>';
  }
}
