import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClubEntity } from '../clubs/entities/club.entity';
import { Role } from '../common/enums';
import { UserClubEntity } from './entities/user-club.entity';
import { AuthenticatedUser } from './types/authenticated-user';

/**
 * Helper d'autorisation scopé par club.
 *
 * Modèle : un user de rôle ORGANISATEUR n'a accès qu'aux ressources des clubs
 * pour lesquels il a une ligne dans `user_club`. Un ADMIN bypasse le check
 * (super-user global). Un MOBILE n'est pas concerné (ses checks reposent sur
 * l'ownership des paiements, pas sur le scope club).
 *
 * Appelé **dans les services** (pas dans les controllers), après le lookup
 * de la ressource, pour rester proche du `clubId` réel et testable unitairement.
 *
 * Cf. design : `~/.claude/projects/-Users-sami-projets-OpenDossard/2026-05-19-opendossard-autorisations-design.md`.
 */
@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(UserClubEntity)
    private readonly userClubRepo: Repository<UserClubEntity>,
    @InjectRepository(ClubEntity)
    private readonly clubRepo: Repository<ClubEntity>,
  ) {}

  /**
   * Lance `ForbiddenException` si `user` n'a pas accès au club `clubId`.
   * Style fail-fast : pas de retour booléen pour éviter les `if (!ok) throw`
   * cassables.
   *
   * ADMIN passe sans aucune query (court-circuit).
   *
   * Message d'erreur : phrasé à la 2e personne (« Vous n'avez pas les droits
   * sur le club X ») avec résolution du `longName` du club pour que le toast
   * frontend soit immédiatement actionnable par l'utilisateur (qui ne sait
   * pas ce qu'est un clubId numérique). Le lookup est best-effort : si le
   * club n'existe pas (cas marginal), on retombe sur l'ID brut.
   */
  async assertClubAccess(user: AuthenticatedUser, clubId: number): Promise<void> {
    if (user.roles.includes(Role.ADMIN)) return;

    const link = await this.userClubRepo.findOne({
      where: { userId: user.id, clubId },
    });
    if (!link) {
      const club = await this.clubRepo.findOne({
        where: { id: clubId },
        select: { id: true, longName: true },
      });
      const clubLabel = club ? `« ${club.longName} »` : `#${clubId}`;
      throw new ForbiddenException(
        `Vous n'avez pas les droits sur le club ${clubLabel}. Demandez à un administrateur de vous y rattacher.`,
      );
    }
  }

  /**
   * Retourne la liste des `clubId` accessibles par ce user, ou la sentinelle
   * `'ALL'` pour un ADMIN. Les services qui font des listings traduisent
   * `'ALL'` en "pas de filtre" et `number[]` en `WHERE clubId IN (...)`.
   */
  async listAccessibleClubIds(user: AuthenticatedUser): Promise<number[] | 'ALL'> {
    if (user.roles.includes(Role.ADMIN)) return 'ALL';
    const links = await this.userClubRepo.find({ where: { userId: user.id } });
    return links.map(l => l.clubId);
  }

  /**
   * Forme "API-friendly" de `listAccessibleClubIds` : un objet discriminé
   * exposable tel quel au frontend pour qu'il sache quels clubs il peut
   * éditer/supprimer côté UI. ADMIN renvoie `{ scope: 'ALL' }`, les autres
   * renvoient `{ scope: 'SCOPED', clubIds: [...] }` (potentiellement vide).
   */
  async getAccessibleClubsScope(
    user: AuthenticatedUser,
  ): Promise<{ scope: 'ALL' } | { scope: 'SCOPED'; clubIds: number[] }> {
    const ids = await this.listAccessibleClubIds(user);
    if (ids === 'ALL') return { scope: 'ALL' };
    return { scope: 'SCOPED', clubIds: ids };
  }

  /**
   * Vérifie qu'un user a le droit d'agir sur une compétition donnée.
   *
   * - ADMIN passe toujours.
   * - Si la compétition a un `clubId`, on délègue à `assertClubAccess`.
   * - Si elle n'a pas de club rattaché (`clubId == null`), seul ADMIN peut —
   *   on ne peut pas scoper un ORGANISATEUR à une compet sans club.
   *
   * Le caller fournit la compet déjà résolue (id + clubId) pour éviter qu'on
   * fasse une seconde query DB ici alors que le caller vient souvent de la
   * fetcher pour ses propres besoins.
   */
  async assertCompetitionAccess(
    user: AuthenticatedUser,
    competition: { id: number; clubId: number | null | undefined },
  ): Promise<void> {
    if (user.roles.includes(Role.ADMIN)) return;
    if (competition.clubId == null) {
      throw new ForbiddenException(
        `Compétition ${competition.id} sans club rattaché : action réservée aux ADMIN.`,
      );
    }
    await this.assertClubAccess(user, competition.clubId);
  }
}
