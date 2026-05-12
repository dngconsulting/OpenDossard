import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClubsModule } from '../clubs/clubs.module';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoController } from './helloasso.controller';
import { HelloAssoDetailsEntity } from './helloasso-details.entity';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { HelloAssoStateStore } from './helloasso-state.store';

/**
 * Module HelloAsso — OAuth2 + PKCE pour relier un club au compte HelloAsso
 * de l'association.
 *
 * Le state store est in-memory : à un seul replica de l'API. Si on scale,
 * migrer vers une table DB ou Redis (cf. commentaires `helloasso-state.store`).
 */
@Module({
  imports: [TypeOrmModule.forFeature([HelloAssoDetailsEntity]), ClubsModule],
  controllers: [HelloAssoController],
  providers: [HelloAssoConfig, HelloAssoStateStore, HelloAssoOAuthService, HelloAssoDetailsService],
  exports: [HelloAssoOAuthService, HelloAssoDetailsService],
})
export class HelloAssoModule {}
