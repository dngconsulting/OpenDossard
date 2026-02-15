import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { LicencesService } from './licences.service';
import { LicenceImportService } from './licence-import.service';
import { LicencesController } from './licences.controller';
import { LicenceEntity } from './entities/licence.entity';
import { ClubEntity } from '../clubs/entities/club.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LicenceEntity, ClubEntity]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [LicencesController],
  providers: [LicencesService, LicenceImportService],
  exports: [LicencesService],
})
export class LicencesModule {}
