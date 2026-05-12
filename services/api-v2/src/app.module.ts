import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { AuthFirebaseModule } from './auth-firebase/auth-firebase.module';
import { LicencesModule } from './licences/licences.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { RacesModule } from './races/races.module';
import { ClubsModule } from './clubs/clubs.module';
import { ChallengesModule } from './challenges/challenges.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';
import { DeepLinksModule } from './deep-links/deep-links.module';
import { HelloAssoModule } from './helloasso/helloasso.module';

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
        password: configService.getOrThrow('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB', 'dossarddb'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // Auto-migrations au boot. Avec le pattern d'image promue
        // (TEST → PREPROD → PROD sans rebuild), `migrationsRun: true`
        // garantit que chaque container applique les migrations de l'image
        // qu'il déploie, sans dépendre d'un step CI séparé qui peut tourner
        // sur une ancienne image en cas de pull pas synchro.
        // En cas de migration en échec → boot du container crash → état
        // dégradé visible immédiatement (au lieu d'erreurs runtime du genre
        // "column X does not exist" plus tard).
        migrations: [__dirname + '/migrations/*{.js,.ts}'],
        migrationsTableName: 'typeorm_migrations',
        // Désactivé en e2e : `setup-e2e.ts` reconstruit le schéma via
        // `dataSource.synchronize(true)` (plus rapide et déterministe pour
        // les tests) — laisser `migrationsRun` actif provoquerait des
        // conflits entre migrations et auto-sync.
        migrationsRun: configService.get('NODE_ENV') !== 'test',
        synchronize: false, // Never true in production
        logging: configService.get('NODE_ENV') === 'development',
        maxQueryExecutionTime: 10000,
      }),
    }),

    // Firebase Admin (global, injectable everywhere via FIREBASE_ADMIN token)
    FirebaseModule,

    // Feature modules
    AuthModule,
    AuthFirebaseModule,
    LicencesModule,
    CompetitionsModule,
    RacesModule,
    ClubsModule,
    ChallengesModule,
    DashboardModule,
    UsersModule,
    HealthModule,
    ReportsModule,
    DeepLinksModule,
    HelloAssoModule,
  ],
})
export class AppModule {}
