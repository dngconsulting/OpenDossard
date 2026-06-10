import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { CompetitionPushResultDto } from './dto/competition-push-result.dto';
import { UserFavoriteEntity } from './entities/user-favorite.entity';
import { NotificationService } from './notification.service';

/**
 * Push organisateur → users ayant starré une épreuve.
 *
 * Autorisation au niveau service (pattern `AuthorizationService`) : ADMIN
 * passe, ORGANISATEUR uniquement si l'épreuve appartient à un de ses clubs
 * (`user_club`), épreuve sans club réservée aux ADMIN.
 *
 * Fire-and-forget : aucun historique persisté — l'appelant reçoit les stats
 * (`targetedUsers`/`sentDevices`) et l'envoi est loggé côté serveur.
 */
@Injectable()
export class CompetitionPushService {
  private readonly logger = new Logger(CompetitionPushService.name);

  constructor(
    @InjectRepository(UserFavoriteEntity)
    private readonly favorites: Repository<UserFavoriteEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitions: Repository<CompetitionEntity>,
    private readonly authorization: AuthorizationService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Envoie `message` à tous les starreurs de l'épreuve. Titre du push = nom
   * de l'épreuve (non saisi par l'organisateur) ; `data.competitionId` permet
   * le deeplink vers la fiche épreuve côté app.
   */
  async pushToStarrers(
    user: AuthenticatedUser,
    competitionId: number,
    message: string,
  ): Promise<CompetitionPushResultDto> {
    const competition = await this.competitions.findOne({
      where: { id: competitionId },
      select: { id: true, clubId: true, name: true },
    });
    if (!competition) {
      throw new NotFoundException(`Compétition ${competitionId} introuvable`);
    }
    await this.authorization.assertCompetitionAccess(user, competition);

    const rows = await this.favorites.find({
      where: { competitionId },
      select: { userId: true },
    });
    const userIds = rows.map(r => r.userId);

    // `data.type` : discriminateur de routage côté app (DossardeurV2 route
    // les notifications sur ce champ — cf. `type: 'payment'` des push HelloAsso).
    const result = await this.notifications.sendToUsers(userIds, {
      title: competition.name ?? 'Dossardeur',
      body: message,
      data: { type: 'competition', competitionId: String(competitionId) },
    });

    this.logger.log(
      `pushToStarrers: competitionId=${competitionId} par userId=${user.id} → ${userIds.length} ciblé(s), ${result.successCount} push envoyé(s)`,
    );
    return { targetedUsers: userIds.length, sentDevices: result.successCount };
  }
}
