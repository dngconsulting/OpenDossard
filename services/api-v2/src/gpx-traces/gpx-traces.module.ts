import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { CompetitionGpxTraceEntity } from './entities/competition-gpx-trace.entity';
import { IgnElevationService } from './ign-elevation.service';
import { GpxTracesController } from './gpx-traces.controller';
import { GpxTracesService } from './gpx-traces.service';

/** Importé par CompetitionsModule (contrôle des circuits, copie à la duplication). */
@Module({
  imports: [TypeOrmModule.forFeature([CompetitionGpxTraceEntity, CompetitionEntity]), AuthModule],
  controllers: [GpxTracesController],
  providers: [GpxTracesService, IgnElevationService],
  exports: [GpxTracesService],
})
export class GpxTracesModule {}
