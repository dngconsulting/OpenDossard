import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoOAuthService, HelloAssoTokens } from './helloasso-oauth.service';
import { decryptToken, encryptToken } from './util/token-crypto.util';

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 jours

export interface UpsertLinkInput {
  clubId: number;
  organizationSlug: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  linkedByUserId: number | null;
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
    };

/**
 * Persistance des liaisons HelloAsso ↔ Club. Les tokens sont chiffrés au
 * repos (AES-256-GCM) via `util/token-crypto.util` + `HelloAssoConfig.tokenEncryptionKey`.
 *
 * Trois opérations d'écriture distinctes :
 *  - `upsertLink` : re-passage explicite par la mire OAuth (initial OU re-liaison
 *    par l'admin). Reset `linked_at`, `linked_by_user_id`, `last_refreshed_at = null`.
 *  - `updateAfterRefresh` : refresh OAuth automatique inline (cf. `withHelloAssoClubAccessToken`).
 *    Préserve `linked_at` / `linked_by_user_id`, met à jour `last_refreshed_at`.
 *  - `deleteByClubId` : déliaison par l'admin (bouton "Délier" côté UI).
 */
@Injectable()
export class HelloAssoDetailsService {
  private readonly logger = new Logger(HelloAssoDetailsService.name);

  constructor(
    @InjectRepository(HelloAssoDetailsEntity)
    private readonly repo: Repository<HelloAssoDetailsEntity>,
    private readonly config: HelloAssoConfig,
    private readonly oauth: HelloAssoOAuthService,
  ) {}

  async findByClubId(clubId: number): Promise<HelloAssoDetailsEntity | null> {
    return this.repo.findOne({ where: { clubId } });
  }

  /**
   * Statut local de la liaison pour ce club. Aucune requête HelloAsso ;
   * on se contente des dates stockées en DB. `expired = true` ssi le
   * refresh_token est hors fenêtre 30j (cas où l'admin doit repasser par la mire).
   */
  async getStatus(clubId: number): Promise<HelloAssoLinkStatus> {
    const details = await this.repo.findOne({ where: { clubId } });
    if (!details) return { linked: false };
    return {
      linked: true,
      slug: details.organizationSlug,
      linkedAt: details.linkedAt.toISOString(),
      refreshTokenExpiresAt: details.refreshTokenExpiresAt.toISOString(),
      expired: details.refreshTokenExpiresAt.getTime() < Date.now(),
    };
  }

  /**
   * UPSERT silencieux. Si une liaison existe pour ce club, ses tokens sont
   * remplacés. `linked_at` est rafraîchi à chaque liaison initiale ou
   * ré-initiée (= passage par la mire). `last_refreshed_at` reste null tant
   * qu'aucun refresh OAuth automatique n'a eu lieu.
   */
  async upsertLink(input: UpsertLinkInput): Promise<HelloAssoDetailsEntity> {
    const now = new Date();
    const accessTokenExpiresAt = new Date(now.getTime() + input.expiresInSeconds * 1000);
    const refreshTokenExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000);

    const key = this.config.tokenEncryptionKey;
    const accessTokenEncrypted = encryptToken(input.accessToken, key);
    const refreshTokenEncrypted = encryptToken(input.refreshToken, key);

    const existing = await this.repo.findOne({ where: { clubId: input.clubId } });
    if (existing) {
      existing.organizationSlug = input.organizationSlug;
      existing.accessTokenEncrypted = accessTokenEncrypted;
      existing.refreshTokenEncrypted = refreshTokenEncrypted;
      existing.accessTokenExpiresAt = accessTokenExpiresAt;
      existing.refreshTokenExpiresAt = refreshTokenExpiresAt;
      existing.linkedByUserId = input.linkedByUserId;
      existing.linkedAt = now;
      existing.lastRefreshedAt = null;
      const saved = await this.repo.save(existing);
      this.logger.log(
        `upsertLink: refreshed link clubId=${input.clubId} slug=${input.organizationSlug} by user=${input.linkedByUserId}`,
      );
      return saved;
    }

    const created = this.repo.create({
      clubId: input.clubId,
      organizationSlug: input.organizationSlug,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      linkedByUserId: input.linkedByUserId,
      linkedAt: now,
      lastRefreshedAt: null,
    });
    const saved = await this.repo.save(created);
    this.logger.log(
      `upsertLink: created link id=${saved.id} clubId=${input.clubId} slug=${input.organizationSlug} by user=${input.linkedByUserId}`,
    );
    return saved;
  }

  /**
   * Supprime la liaison HelloAsso d'un club. Réversible via re-passage par la mire.
   * Pas de révocation côté HelloAsso : leurs tokens deviennent simplement orphelins
   * côté OpenDossard mais restent valides côté HelloAsso jusqu'à expiration normale.
   */
  async deleteByClubId(clubId: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { clubId } });
    if (!existing) {
      throw new NotFoundException(`Aucune liaison HelloAsso pour le club ${clubId}`);
    }
    // TypeORM `repo.remove(entity)` mute l'entité et efface son `id` après
    // suppression (cf. doc : l'entité peut être ré-insérée comme une fresh entity).
    // Donc on capture les valeurs AVANT le remove pour le log.
    const removedId = existing.id;
    const removedSlug = existing.organizationSlug;
    await this.repo.remove(existing);
    this.logger.log(`deleteByClubId: removed link id=${removedId} clubId=${clubId} slug=${removedSlug}`);
  }

  /**
   * Persiste les nouveaux tokens après un refresh OAuth réussi. **Ne touche
   * pas à `linked_at` ni `linked_by_user_id`** — ce n'est PAS une re-liaison.
   * Met à jour `last_refreshed_at`, les 2 tokens chiffrés et leurs expirations.
   *
   * HelloAsso rotate le refresh_token à chaque usage (pratique OAuth standard) —
   * donc le `refreshTokenExpiresAt` est reseté à now + 30j à chaque refresh.
   */
  async updateAfterRefresh(clubId: number, newTokens: HelloAssoTokens): Promise<void> {
    const now = new Date();
    const accessTokenExpiresAt = new Date(now.getTime() + newTokens.expiresIn * 1000);
    const refreshTokenExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000);
    const key = this.config.tokenEncryptionKey;

    await this.repo.update(
      { clubId },
      {
        accessTokenEncrypted: encryptToken(newTokens.accessToken, key),
        refreshTokenEncrypted: encryptToken(newTokens.refreshToken, key),
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        lastRefreshedAt: now,
      },
    );
    this.logger.log(`updateAfterRefresh: refreshed tokens for clubId=${clubId}`);
  }

  /**
   * Exécute `fn(accessToken)` avec le token courant du club. Sur 401, refresh
   * inline + retry une seule fois ; pas de mutex (cf. design Lot 5). Si le
   * refresh lui-même échoue (refresh_token mort) → propage `UnauthorizedException`
   * avec un message explicite pour l'admin (re-passer par la mire).
   *
   * Choix design assumé : stateless, pas de sérialisation. Risque résiduel
   * marginal en cas de N callers concurrents qui expirent simultanément
   * (HelloAsso rotate les refresh_tokens → seul le 1er refresh gagne).
   * Acceptable pour la fréquence/volume OpenDossard.
   */
  async withHelloAssoClubAccessToken<T>(
    clubId: number,
    fn: (accessToken: string) => Promise<T>,
  ): Promise<T> {
    const details = await this.findByClubId(clubId);
    if (!details) {
      throw new NotFoundException(`Aucune liaison HelloAsso pour clubId=${clubId}`);
    }
    const { accessToken, refreshToken } = this.decryptTokens(details);

    try {
      return await fn(accessToken);
    } catch (e) {
      if (!(e instanceof UnauthorizedException)) {
        throw e;
      }
      this.logger.log(`withHelloAssoClubAccessToken: 401 on clubId=${clubId} — attempting refresh`);

      let newTokens: HelloAssoTokens;
      try {
        newTokens = await this.oauth.refreshTokens(refreshToken);
      } catch (refreshError: unknown) {
        const msg = refreshError instanceof Error ? refreshError.message : String(refreshError);
        this.logger.warn(
          `withHelloAssoClubAccessToken: refresh failed for clubId=${clubId} (${msg}) — admin must re-link via mire`,
        );
        throw new UnauthorizedException(
          `Liaison HelloAsso expirée pour le club ${clubId} — l'admin doit re-passer par la mire`,
        );
      }

      await this.updateAfterRefresh(clubId, newTokens);

      // Retry UNE seule fois. Si encore 401 → propagation, pas de boucle infinie.
      return await fn(newTokens.accessToken);
    }
  }

  /**
   * Déchiffre les tokens d'une liaison existante. Helper pour les futurs
   * appels API HelloAsso (checkout, refresh job…).
   */
  decryptTokens(details: HelloAssoDetailsEntity): { accessToken: string; refreshToken: string } {
    const key = this.config.tokenEncryptionKey;
    return {
      accessToken: decryptToken(details.accessTokenEncrypted, key),
      refreshToken: decryptToken(details.refreshTokenEncrypted, key),
    };
  }
}
