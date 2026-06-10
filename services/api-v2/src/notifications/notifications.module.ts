import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { DeviceTokenNotifEntity } from './entities/device-token-notif.entity';
import { UserFavoriteEntity } from './entities/user-favorite.entity';
import { CompetitionPushController } from './competition-push.controller';
import { CompetitionPushService } from './competition-push.service';
import { DeviceTokenNotifsController } from './device-token-notifs.controller';
import { DeviceTokenNotifsService } from './device-token-notifs.service';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { NotificationService } from './notification.service';

/**
 * Module notifications push (FCM).
 *
 * - `DeviceTokenNotifsController` / `DeviceTokenNotifsService` : enregistrement
 *   des tokens FCM des appareils.
 * - `FavoritesController` / `FavoritesService` : épreuves starrées par les
 *   users mobiles (cible du fan-out des push organisateur).
 * - `CompetitionPushController` / `CompetitionPushService` : push organisateur
 *   vers les starreurs d'une épreuve (scope club via `AuthorizationService`).
 * - `NotificationService` (générique, exporté) : envoi via `firebase-admin`.
 *   Branché par `HelloAssoModule` pour notifier les transitions de paiement.
 *
 * `FIREBASE_ADMIN` est fourni par le `FirebaseModule` global → injectable ici
 * sans import explicite.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceTokenNotifEntity, UserFavoriteEntity, CompetitionEntity]),
    AuthModule,
  ],
  controllers: [DeviceTokenNotifsController, FavoritesController, CompetitionPushController],
  providers: [
    DeviceTokenNotifsService,
    FavoritesService,
    CompetitionPushService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
