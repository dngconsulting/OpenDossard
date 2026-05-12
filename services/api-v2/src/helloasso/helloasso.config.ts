import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Config HelloAsso paramétrable sandbox/prod.
 *
 * Toutes les URLs sont des bases — les chemins (`/authorize`, `/oauth2/token`,
 * `/v5/...`) sont concaténés côté service. Bascule prod = remplacer
 * `-sandbox` dans les 3 URLs, aucune autre modif de code.
 *
 * Sandbox par défaut (cf. .env.example) :
 *   HELLOASSO_OAUTH_BASE_URL=https://auth.helloasso-sandbox.com
 *   HELLOASSO_API_BASE_URL=https://api.helloasso-sandbox.com
 *
 * Prod :
 *   HELLOASSO_OAUTH_BASE_URL=https://auth.helloasso.com
 *   HELLOASSO_API_BASE_URL=https://api.helloasso.com
 *
 * Note : l'URL exacte de la mire en sandbox (`auth.helloasso-sandbox.com`)
 * est notre hypothèse de travail — pas formellement documentée par HelloAsso
 * (cf. mémoire `project_helloasso_mire_autorisation`). À valider au 1er essai.
 */
@Injectable()
export class HelloAssoConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly oauthBaseUrl: string;
  readonly apiBaseUrl: string;
  readonly redirectUri: string;
  /**
   * Origine de la SPA (ex: `http://localhost:5173`) vers laquelle le callback
   * HelloAsso redirige le navigateur. Le path est ajouté côté backend selon
   * le cas :
   *   succès → `${frontResultUrl}/club/{clubId}?status=success&slug=...`
   *   erreur → `${frontResultUrl}/clubs?status=error&reason=...`
   * Le hook global `useHelloAssoLanding` côté SPA lit ces query params,
   * affiche un toast et nettoie l'URL — peu importe la page d'arrivée.
   */
  readonly frontResultUrl: string;
  readonly stateTtlSeconds: number;
  /**
   * Clé AES-256-GCM (32 octets) pour le chiffrement au repos des tokens
   * HelloAsso en DB. Lue depuis `HELLOASSO_TOKEN_ENCRYPTION_KEY` au format
   * base64. Validation de longueur au boot — `getOrThrow` + check 32 octets
   * exactement, sinon crash immédiat (mieux que de découvrir le KO au 1er
   * encrypt en prod).
   */
  readonly tokenEncryptionKey: Buffer;
  /**
   * URLs (typiquement des deep links Dossardeur `dossardeur://payment/*`) vers
   * lesquelles HelloAsso redirige le navigateur après paiement. Passées telles
   * quelles dans `backUrl`/`errorUrl`/`returnUrl` du checkout-intent.
   */
  readonly paymentReturnUrlSuccess: string;
  readonly paymentReturnUrlError: string;
  readonly paymentReturnUrlCancelled: string;
  /**
   * Clé de signature webhook fournie par HelloAsso à l'enregistrement de
   * l'URL de notification (`PUT /v5/partners/me/api-notifications`). Sert
   * de secret partagé HMAC-SHA256 pour vérifier les webhooks entrants.
   * Chaîne opaque, stockée telle quelle en env.
   */
  readonly webhookSignatureKey: string;

  constructor(configService: ConfigService) {
    // requireNonEmpty (vs `getOrThrow`) : `getOrThrow` ne plante que sur clé
    // absente, pas sur valeur vide. Or une env var commitée à `KEY=` (sans
    // valeur) est un piège classique — le service démarre mais part en panne
    // au 1er appel HelloAsso. On crash le boot tant qu'à faire.
    this.clientId = requireNonEmpty(configService, 'HELLOASSO_CLIENT_ID');
    this.clientSecret = requireNonEmpty(configService, 'HELLOASSO_CLIENT_SECRET');
    this.oauthBaseUrl = trimTrailingSlash(
      requireNonEmpty(configService, 'HELLOASSO_OAUTH_BASE_URL'),
    );
    this.apiBaseUrl = trimTrailingSlash(requireNonEmpty(configService, 'HELLOASSO_API_BASE_URL'));
    this.redirectUri = requireNonEmpty(configService, 'HELLOASSO_REDIRECT_URI');
    this.frontResultUrl = requireNonEmpty(configService, 'HELLOASSO_FRONT_RESULT_URL');
    this.stateTtlSeconds = configService.get<number>('HELLOASSO_STATE_TTL_SECONDS', 600);
    this.tokenEncryptionKey = decodeEncryptionKey(
      requireNonEmpty(configService, 'HELLOASSO_TOKEN_ENCRYPTION_KEY'),
    );
    this.paymentReturnUrlSuccess = requireNonEmpty(configService, 'HELLOASSO_PAYMENT_RETURN_URL_SUCCESS');
    this.paymentReturnUrlError = requireNonEmpty(configService, 'HELLOASSO_PAYMENT_RETURN_URL_ERROR');
    this.paymentReturnUrlCancelled = requireNonEmpty(configService, 'HELLOASSO_PAYMENT_RETURN_URL_CANCELLED');
    this.webhookSignatureKey = requireNonEmpty(configService, 'HELLOASSO_WEBHOOK_SIGNATURE_KEY');
  }

  get authorizeEndpoint(): string {
    return `${this.oauthBaseUrl}/authorize`;
  }

  get tokenEndpoint(): string {
    return `${this.apiBaseUrl}/oauth2/token`;
  }
}

function requireNonEmpty(configService: ConfigService, key: string): string {
  const value = configService.getOrThrow<string>(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is set but empty — provide a non-empty value in .env`);
  }
  return value;
}

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function decodeEncryptionKey(b64: string): Buffer {
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `HELLOASSO_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (AES-256), got ${key.length}. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  return key;
}
