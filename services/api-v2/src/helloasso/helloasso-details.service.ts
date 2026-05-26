import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoConfig } from './helloasso.config';
import { encryptToken } from './util/token-crypto.util';

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 jours

export interface UpsertLinkInput {
  clubId: number;
  organizationSlug: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  linkedByUserId: number | null;
  /**
   * Valeur initiale de `isCashInCompliant` lue côté HelloAsso au moment de
   * la liaison. `null` autorisé : si le GET orga échoue, on persiste null
   * pour ne pas casser la liaison — la valeur sera rattrapée par le webhook
   * `Organization.IsCashinCompliant` au prochain changement côté HA.
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
 * Persistance des liaisons HelloAsso ↔ Club. Les tokens sont chiffrés au
 * repos (AES-256-GCM) via `util/token-crypto.util` + `HelloAssoConfig.tokenEncryptionKey`.
 *
 * Deux opérations d'écriture distinctes :
 *  - `upsertLink` : re-passage explicite par la mire OAuth (initial OU re-liaison
 *    par l'admin). Reset `linked_at`, `linked_by_user_id`, `last_refreshed_at = null`.
 *  - `deleteByClubId` : déliaison par l'admin (bouton "Délier" côté UI).
 *
 * Note : les tokens club sont stockés au repos (preuve du lien) mais ne sont
 * plus rafraîchis ni utilisés au runtime — les appels HelloAsso (checkout,
 * lecture d'intent) passent désormais par le token PARTENAIRE
 * (`HelloAssoOAuthService.getPartnerAccessToken`), résilient à l'expiration du
 * lien OAuth de l'asso.
 */
@Injectable()
export class HelloAssoDetailsService {
  private readonly logger = new Logger(HelloAssoDetailsService.name);

  constructor(
    @InjectRepository(HelloAssoDetailsEntity)
    private readonly repo: Repository<HelloAssoDetailsEntity>,
    private readonly config: HelloAssoConfig,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
      isCashInCompliant: details.isCashInCompliant,
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
      // Lot 3 — protection contre le scénario D1 du threat model : ne JAMAIS
      // écraser silencieusement un slug existant par un slug différent. Sinon,
      // un user qui aurait conservé l'accès au club côté OD pourrait re-lier
      // le club vers une orga HelloAsso qu'il contrôle, et détourner les
      // futurs paiements. Exiger un DELETE explicite avant pour acter le
      // changement d'organisation HelloAsso.
      if (existing.organizationSlug !== input.organizationSlug) {
        this.logger.warn(
          `upsertLink REJECTED: clubId=${input.clubId} déjà lié à slug=${existing.organizationSlug}, tentative de re-liaison vers slug=${input.organizationSlug} par user=${input.linkedByUserId}`,
        );
        throw new ConflictException(
          `Ce club est déjà lié à une autre organisation HelloAsso (${existing.organizationSlug}). Délie d'abord la liaison existante avant de re-lier à une orga différente.`,
        );
      }
      existing.organizationSlug = input.organizationSlug;
      existing.accessTokenEncrypted = accessTokenEncrypted;
      existing.refreshTokenEncrypted = refreshTokenEncrypted;
      existing.accessTokenExpiresAt = accessTokenExpiresAt;
      existing.refreshTokenExpiresAt = refreshTokenExpiresAt;
      existing.linkedByUserId = input.linkedByUserId;
      existing.linkedAt = now;
      existing.lastRefreshedAt = null;
      existing.isCashInCompliant = input.isCashInCompliant;
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
      isCashInCompliant: input.isCashInCompliant,
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
   *
   * **Effet de bord** : désactive aussi `online_registration_enabled` sur toutes
   * les compétitions de ce club, dans la même transaction. Sans cette cascade,
   * les compets gardent leur flag à `true` après le délink, l'UI cache le switch
   * (car le club n'a plus de lien HA) mais les utilisateurs peuvent quand même
   * initier des paiements qui échoueront au moment du POST checkout-intent avec
   * "Paiement en ligne indisponible". On normalise donc l'état en DB pour
   * matcher l'UI.
   *
   * **Hors scope** (intentionnel) : les paiements HelloAsso `pending` au moment
   * du délink ne sont PAS annulés. Ils restent dans leur état actuel ; HelloAsso
   * les traitera (ou pas) côté leur infra selon leur propre logique.
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

    const competitionsDisabled = await this.dataSource.transaction(async manager => {
      const updateResult = await manager
        .createQueryBuilder()
        .update(CompetitionEntity)
        .set({ onlineRegistrationEnabled: false })
        .where('club_id = :clubId', { clubId })
        .andWhere('online_registration_enabled = true')
        .execute();
      await manager.remove(existing);
      return updateResult.affected ?? 0;
    });

    this.logger.log(
      `deleteByClubId: removed link id=${removedId} clubId=${clubId} slug=${removedSlug} | ` +
        `disabled online_registration_enabled on ${competitionsDisabled} competition(s)`,
    );
  }

  /**
   * Met à jour le drapeau `isCashInCompliant` d'une liaison existante, identifiée
   * par son `organizationSlug`. Renvoie le nombre de lignes affectées (0 si
   * aucune liaison locale ne correspond au slug — webhook orphelin).
   *
   * Appelé par le receiver webhook `Organization.IsCashinCompliant`.
   */
  async setIsCashInCompliantBySlug(
    organizationSlug: string,
    isCashInCompliant: boolean,
  ): Promise<number> {
    const result = await this.repo.update({ organizationSlug }, { isCashInCompliant });
    return result.affected ?? 0;
  }
}
