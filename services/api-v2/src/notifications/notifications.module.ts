import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { DeviceTokenNotifEntity } from './entities/device-token-notif.entity';
import { UserFavoriteEntity } from './entities/user-favorite.entity';
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
  controllers: [DeviceTokenNotifsController, FavoritesController],
  providers: [DeviceTokenNotifsService, FavoritesService, NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
