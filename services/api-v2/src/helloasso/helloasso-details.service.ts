import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { And, DataSource, LessThan, MoreThan, Repository } from 'typeorm';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoOrganizationEntity } from './entities/helloasso-organization.entity';
import { HelloAssoConfig } from './helloasso.config';
import { encryptToken } from './util/token-crypto.util';

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 jours

/**
 * Nouvelle chaîne de tokens d'une orga (passage par la mire). Paramètres :
 * slug, access, refresh, expiration access, expiration refresh, conformité
 * (`null` = inconnue, conserve la valeur en place).
 */
const UPDATE_ORG_CHAIN_SQL = `
  UPDATE helloasso_organization SET
    access_token = $2,
    refresh_token = $3,
    access_token_expires_at = $4,
    refresh_token_expires_at = $5,
    last_refreshed_at = NULL,
    is_cash_in_compliant = COALESCE($6, is_cash_in_compliant),
    updated_at = now()
  WHERE organization_slug = $1`;

/** Idem, en créant l'orga si elle n'existe pas encore. Renvoie son id. */
const UPSERT_ORG_CHAIN_SQL = `
  INSERT INTO helloasso_organization (
    organization_slug, access_token, refresh_token,
    access_token_expires_at, refresh_token_expires_at, last_refreshed_at, is_cash_in_compliant
  ) VALUES ($1, $2, $3, $4, $5, NULL, $6)
  ON CONFLICT (organization_slug) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    access_token_expires_at = EXCLUDED.access_token_expires_at,
    refresh_token_expires_at = EXCLUDED.refresh_token_expires_at,
    last_refreshed_at = NULL,
    is_cash_in_compliant = COALESCE(EXCLUDED.is_cash_in_compliant, helloasso_organization.is_cash_in_compliant),
    updated_at = now()
  RETURNING id`;

const LOCK_ORG_SQL = 'SELECT id FROM helloasso_organization WHERE id = $1 FOR UPDATE';

export interface UpsertLinkInput {
  clubId: number;
  organizationSlug: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  linkedByUserId: number | null;
  /**
   * Valeur de `isCashInCompliant` lue côté HelloAsso au moment de la liaison.
   * `null` autorisé : si le GET orga échoue, on ne casse pas la liaison — une
   * orga déjà connue garde sa valeur, une nouvelle orga part de null, rattrapée
   * par le webhook `Organization.IsCashinCompliant` au prochain changement.
   */
  isCashInCompliant: boolean | null;
}

export type HelloAssoLinkStatus =
  | { linked: false }
  | {
      linked: true;
      slug: string;
      /** ISO 8601 string — sérialisation explicite pour matcher le DTO frontend. */
      linkedAt: string;
      /** ISO 8601 string. */
      refreshTokenExpiresAt: string;
      expired: boolean;
      /**
       * Reflet de `isCashInCompliant` côté HelloAsso (drapeau d'éligibilité à
       * l'encaissement). `null` = inconnu (liaison avant intégration ou GET
       * orga en échec). `false` = exigences admin HA non finalisées → aucun
       * paiement ne sera encaissé.
       */
      isCashInCompliant: boolean | null;
    };

/**
 * Persistance des liaisons HelloAsso, en deux niveaux :
 *  - l'**orga** (`helloasso_organization`) porte la liaison OAuth (tokens
 *    chiffrés AES-256-GCM via `util/token-crypto.util`) et la conformité ;
 *  - le **rattachement** (`helloasso_details`) relie un club à une orga.
 * Plusieurs clubs peuvent se rattacher à la même orga (un par fédération).
 *
 * Opérations d'écriture :
 *  - `upsertLink` : passage par la mire pour un club. Met la chaîne de tokens
 *    de l'orga à jour (créée si besoin), puis le rattachement du club.
 *  - `applyRefreshedTokens` : renouvellement technique d'une orga (job planifié,
 *    rafraîchissement manuel de conformité).
 *  - `deleteByClubId` : déliaison d'un club ; l'orga est supprimée quand plus
 *    aucun club n'y est rattaché.
 *
 * Note : les tokens ne sont pas utilisés au runtime — les appels HelloAsso
 * (checkout, lecture d'intent) passent par le token PARTENAIRE
 * (`HelloAssoOAuthService.getPartnerAccessToken`). Ils restent la **preuve du
 * lien**, renouvelés par `HelloAssoTokenRefreshService` pour que la liaison ne
 * meure pas d'expiration (fenêtre refresh de 30 jours).
 */
@Injectable()
export class HelloAssoDetailsService {
  private readonly logger = new Logger(HelloAssoDetailsService.name);

  constructor(
    @InjectRepository(HelloAssoDetailsEntity)
    private readonly repo: Repository<HelloAssoDetailsEntity>,
    @InjectRepository(HelloAssoOrganizationEntity)
    private readonly orgRepo: Repository<HelloAssoOrganizationEntity>,
    private readonly config: HelloAssoConfig,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** Rattachement d'un club, avec son orga (eager). */
  async findByClubId(clubId: number): Promise<HelloAssoDetailsEntity | null> {
    return this.repo.findOne({ where: { clubId } });
  }

  /**
   * Orgas dont le refresh token arrive à expiration dans moins de `withinDays`
   * jours — candidates au renouvellement par le job planifié. Une ligne par
   * orga : ses clubs partagent la chaîne.
   *
   * Les orgas **déjà expirées sont exclues** (borne basse `> now`) : HelloAsso
   * rejetterait leur refresh token, et le lien est de toute façon perdu —
   * l'admin doit repasser par la mire.
   *
   * Tri par expiration croissante : si un run est interrompu, les liens les
   * plus urgents ont déjà été traités.
   */
  async findExpiringOrganizations(withinDays: number): Promise<HelloAssoOrganizationEntity[]> {
    const now = new Date();
    const limit = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return this.orgRepo.find({
      where: { refreshTokenExpiresAt: And(MoreThan(now), LessThan(limit)) },
      order: { refreshTokenExpiresAt: 'ASC' },
    });
  }

  /**
   * Statut local de la liaison pour ce club. Aucune requête HelloAsso ;
   * on se contente des dates stockées en DB. `expired = true` ssi le
   * refresh_token de l'orga est hors fenêtre 30j (l'admin doit repasser par
   * la mire).
   */
  async getStatus(clubId: number): Promise<HelloAssoLinkStatus> {
    const link = await this.findByClubId(clubId);
    if (!link) return { linked: false };
    const org = link.organization;
    return {
      linked: true,
      slug: org.organizationSlug,
      linkedAt: link.linkedAt.toISOString(),
      refreshTokenExpiresAt: org.refreshTokenExpiresAt.toISOString(),
      expired: org.refreshTokenExpiresAt.getTime() < Date.now(),
      isCashInCompliant: org.isCashInCompliant,
    };
  }

  /**
   * Passage par la mire pour un club : enregistre la chaîne de tokens de l'orga
   * (créée au premier club), puis rattache le club. `linked_at` date le passage
   * par la mire de CE club ; `last_refreshed_at` de l'orga repart à null.
   *
   * Garde D1 (threat model) : un club déjà rattaché à une AUTRE orga n'est
   * jamais re-rattaché silencieusement — sinon un user ayant gardé l'accès au
   * club pourrait détourner ses paiements vers une orga qu'il contrôle. Délier
   * d'abord. Même dans ce cas, la chaîne de l'orga autorisée est enregistrée si
   * l'orga est déjà connue : HelloAsso vient de révoquer sa chaîne précédente,
   * la jeter couperait la liaison des clubs qui y sont rattachés. (Cas rare via
   * le callback : il exige `club.helloAssoSlug` = slug autorisé, champ que l'on
   * ne peut pas modifier tant que le club est lié.)
   */
  async upsertLink(input: UpsertLinkInput): Promise<HelloAssoDetailsEntity> {
    const now = new Date();
    const key = this.config.tokenEncryptionKey;
    const chain = {
      accessTokenEncrypted: encryptToken(input.accessToken, key),
      refreshTokenEncrypted: encryptToken(input.refreshToken, key),
      accessTokenExpiresAt: new Date(now.getTime() + input.expiresInSeconds * 1000),
      refreshTokenExpiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    };

    const result = await this.dataSource.transaction(async manager => {
      const links = manager.getRepository(HelloAssoDetailsEntity);
      const orgs = manager.getRepository(HelloAssoOrganizationEntity);

      const existingLink = await links.findOne({ where: { clubId: input.clubId } });
      const conflictSlug =
        existingLink && existingLink.organization.organizationSlug !== input.organizationSlug
          ? existingLink.organization.organizationSlug
          : null;

      // Écriture atomique de l'orga, qui verrouille sa ligne jusqu'au commit :
      // deux liaisons simultanées sur une même orga ne se marchent pas dessus
      // (pas de violation d'unicité à la création), et une déliaison
      // concurrente (qui verrouille la même ligne) est sérialisée. Limite : on
      // ne connaît pas l'ordre d'émission des grants chez HelloAsso — si deux
      // mires de la même orga aboutissent au même instant, la dernière écrite
      // gagne, même si HelloAsso a gardé l'autre.
      const params = [
        input.organizationSlug,
        chain.accessTokenEncrypted,
        chain.refreshTokenEncrypted,
        chain.accessTokenExpiresAt,
        chain.refreshTokenExpiresAt,
        // Une lecture HelloAsso en échec (null) ne remplace pas une valeur connue.
        input.isCashInCompliant,
      ];
      if (conflictSlug) {
        // Club refusé (garde D1) : on n'enregistre la chaîne que si l'orga est
        // déjà connue — jamais de création pour un club qu'on refuse.
        await manager.query(UPDATE_ORG_CHAIN_SQL, params);
        return { conflictSlug };
      }
      const rows: { id: number }[] = await manager.query(UPSERT_ORG_CHAIN_SQL, params);

      const org = await orgs.findOneOrFail({ where: { id: rows[0].id } });
      const link = existingLink ?? links.create({ clubId: input.clubId });
      link.organizationId = org.id;
      link.organization = org;
      link.linkedByUserId = input.linkedByUserId;
      link.linkedAt = now;
      return { link: await links.save(link) };
    });

    if (!result.link) {
      this.logger.warn(
        `upsertLink REJECTED: clubId=${input.clubId} déjà lié à slug=${result.conflictSlug}, tentative vers slug=${input.organizationSlug} par user=${input.linkedByUserId}`,
      );
      throw new ConflictException(
        `Ce club est déjà lié à une autre organisation HelloAsso (${result.conflictSlug}). Délie d'abord la liaison existante avant de re-lier à une orga différente.`,
      );
    }
    this.logger.log(
      `upsertLink: clubId=${input.clubId} rattaché à slug=${input.organizationSlug} (orgId=${result.link.organizationId}) by user=${input.linkedByUserId}`,
    );
    return result.link;
  }

  /**
   * Applique un renouvellement de tokens sur une orga.
   *
   * **Volontairement distincte de `upsertLink`** (sémantique « passage par la
   * mire » : `linked_at`, audit, garde D1). Le slug n'est jamais écrit ici : le
   * grant `refresh_token` ne renvoie pas `organization_slug`.
   *
   * **Écriture conditionnelle** : n'écrit que si le refresh token en base est
   * toujours celui qui a été rafraîchi (`refreshedFrom`). Si un passage par la
   * mire l'a remplacé entre la lecture et l'écriture, HelloAsso a révoqué
   * l'ancienne chaîne : écrire son successeur écraserait la chaîne vivante.
   * Renvoie `false` dans ce cas (rien d'écrit).
   *
   * `update()` ciblé plutôt que `save(entity)` : le webhook
   * `Organization.IsCashinCompliant` peut modifier la même ligne entre-temps.
   */
  async applyRefreshedTokens(
    refreshedFrom: Pick<HelloAssoOrganizationEntity, 'id' | 'refreshTokenEncrypted'>,
    tokens: { accessToken: string; refreshToken: string; expiresInSeconds: number },
  ): Promise<boolean> {
    const now = new Date();
    const key = this.config.tokenEncryptionKey;
    const result = await this.orgRepo.update(
      { id: refreshedFrom.id, refreshTokenEncrypted: refreshedFrom.refreshTokenEncrypted },
      {
        accessTokenEncrypted: encryptToken(tokens.accessToken, key),
        refreshTokenEncrypted: encryptToken(tokens.refreshToken, key),
        accessTokenExpiresAt: new Date(now.getTime() + tokens.expiresInSeconds * 1000),
        refreshTokenExpiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        lastRefreshedAt: now,
      },
    );
    return (result.affected ?? 0) > 0;
  }

  /**
   * Délie un club. Réversible via re-passage par la mire. Pas de révocation
   * côté HelloAsso. L'orga est supprimée quand plus aucun club n'y est
   * rattaché ; sinon elle reste liée pour les autres clubs.
   *
   * **Effet de bord** : désactive aussi `online_registration_enabled` sur toutes
   * les compétitions de ce club, dans la même transaction. Sans cette cascade,
   * les compets gardent leur flag à `true` après le délink, l'UI cache le switch
   * (car le club n'a plus de lien HA) mais les utilisateurs peuvent quand même
   * initier des paiements qui échoueront au moment du POST checkout-intent avec
   * "Paiement en ligne indisponible".
   *
   * **Hors scope** (intentionnel) : les paiements HelloAsso `pending` au moment
   * du délink ne sont PAS annulés.
   */
  async deleteByClubId(clubId: number): Promise<void> {
    const existing = await this.findByClubId(clubId);
    if (!existing) {
      throw new NotFoundException(`Aucune liaison HelloAsso pour le club ${clubId}`);
    }
    const { id: linkId, organizationId } = existing;
    const slug = existing.organization.organizationSlug;

    const { competitionsDisabled, orgRemoved } = await this.dataSource.transaction(
      async manager => {
        // Verrou sur l'orga avant de compter ses clubs : deux déliaisons
        // simultanées des derniers clubs ne laissent pas d'orga orpheline, et
        // une liaison concurrente (qui verrouille la même ligne) est sérialisée.
        await manager.query(LOCK_ORG_SQL, [organizationId]);
        const updateResult = await manager
          .createQueryBuilder()
          .update(CompetitionEntity)
          .set({ onlineRegistrationEnabled: false })
          .where('club_id = :clubId', { clubId })
          .andWhere('online_registration_enabled = true')
          .execute();
        await manager.delete(HelloAssoDetailsEntity, { id: linkId });
        const remaining = await manager.count(HelloAssoDetailsEntity, {
          where: { organizationId },
        });
        if (remaining === 0) {
          await manager.delete(HelloAssoOrganizationEntity, { id: organizationId });
        }
        return { competitionsDisabled: updateResult.affected ?? 0, orgRemoved: remaining === 0 };
      },
    );

    this.logger.log(
      `deleteByClubId: removed link id=${linkId} clubId=${clubId} slug=${slug}` +
        `${orgRemoved ? ' (orga supprimée, plus aucun club rattaché)' : ''} | ` +
        `disabled online_registration_enabled on ${competitionsDisabled} competition(s)`,
    );
  }

  /**
   * Met à jour le drapeau `isCashInCompliant` d'une orga, identifiée par son
   * slug. Vaut pour tous les clubs qui y sont rattachés. Renvoie le nombre de
   * lignes affectées (0 si l'orga n'est pas liée chez nous — webhook orphelin).
   *
   * Appelé par le receiver webhook `Organization.IsCashinCompliant` et par le
   * rafraîchissement manuel du statut de conformité.
   */
  async setIsCashInCompliantBySlug(
    organizationSlug: string,
    isCashInCompliant: boolean,
  ): Promise<number> {
    const result = await this.orgRepo.update({ organizationSlug }, { isCashInCompliant });
    return result.affected ?? 0;
  }
}
