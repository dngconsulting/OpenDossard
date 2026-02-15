import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { LicencesModule } from './licences/licences.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { RacesModule } from './races/races.module';
import { ClubsModule } from './clubs/clubs.module';
import { ChallengesModule } from './challenges/challenges.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: configService.get<number>('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'dossarduser'),
        password: configService.get('POSTGRES_PASSWORD', 'dossardpassword'),
        database: configService.get('POSTGRES_DB', 'dossarddb'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Never true in production
        logging: configService.get('NODE_ENV') === 'development',
        maxQueryExecutionTime: 10000,
      }),
    }),

    // Feature modules
    AuthModule,
    LicencesModule,
    CompetitionsModule,
    RacesModule,
    ClubsModule,
    ChallengesModule,
    DashboardModule,
    UsersModule,
    HealthModule,
    ReportsModule,
  ],
})
export class AppModule {}
