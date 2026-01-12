import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { LicencesService } from './licences.service';
import { LicencesController } from './licences.controller';
import { LicenceEntity } from './entities/licence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LicenceEntity]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [LicencesController],
  providers: [LicencesService],
  exports: [LicencesService],
})
export class LicencesModule {}
