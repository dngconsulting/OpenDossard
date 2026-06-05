import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { DeviceTokenNotifEntity } from './entities/device-token-notif.entity';
import { DeviceTokenNotifsController } from './device-token-notifs.controller';
import { DeviceTokenNotifsService } from './device-token-notifs.service';
import { NotificationService } from './notification.service';

/**
 * Module notifications push (FCM).
 *
 * - `DeviceTokenNotifsController` / `DeviceTokenNotifsService` : enregistrement
 *   des tokens FCM des appareils.
 * - `NotificationService` (générique, exporté) : envoi via `firebase-admin`.
 *   Branché par `HelloAssoModule` pour notifier les transitions de paiement.
 *
 * `FIREBASE_ADMIN` est fourni par le `FirebaseModule` global → injectable ici
 * sans import explicite.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DeviceTokenNotifEntity]), AuthModule],
  controllers: [DeviceTokenNotifsController],
  providers: [DeviceTokenNotifsService, NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
