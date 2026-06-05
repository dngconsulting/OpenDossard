import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { ClubsModule } from '../clubs/clubs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { UserEntity } from '../users/entities/user.entity';
import { HelloAssoApiClient } from './helloasso-api.client';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoController } from './helloasso.controller';
import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoPaymentEntity } from './entities/helloasso-payment.entity';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { HelloAssoPaymentController } from './helloasso-payment.controller';
import { HelloAssoPaymentService } from './helloasso-payment.service';
import { HelloAssoPaymentsAdminService } from './helloasso-payments-admin.service';
import { HelloAssoStateStore } from './helloasso-state.store';
import { HelloAssoWebhookController } from './helloasso-webhook.controller';
import { HelloAssoWebhookKeysService } from './helloasso-webhook-keys.service';
import { HelloAssoWebhookService } from './helloasso-webhook.service';

/**
 * Module HelloAsso — OAuth2 + PKCE pour relier un club au compte HelloAsso,
 * plus le flux de paiement coureur (checkout-intent, webhook à venir Lot 4).
 *
 * Le state store est in-memory : à un seul replica de l'API. Si on scale,
 * migrer vers une table DB ou Redis (cf. commentaires `helloasso-state.store`).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      HelloAssoDetailsEntity,
      HelloAssoPaymentEntity,
      CompetitionEntity,
      LicenceEntity,
      UserEntity,
    ]),
    AuthModule,
    ClubsModule,
    NotificationsModule,
  ],
  controllers: [HelloAssoController, HelloAssoPaymentController, HelloAssoWebhookController],
  providers: [
    HelloAssoConfig,
    HelloAssoStateStore,
    HelloAssoOAuthService,
    HelloAssoDetailsService,
    HelloAssoApiClient,
    HelloAssoPaymentService,
    HelloAssoPaymentsAdminService,
    HelloAssoWebhookKeysService,
    HelloAssoWebhookService,
  ],
  exports: [HelloAssoOAuthService, HelloAssoDetailsService, HelloAssoPaymentService],
})
export class HelloAssoModule {}
