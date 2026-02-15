import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { AuthHelper } from './helpers/auth.helper';
import { SeedHelper } from './helpers/seed.helper';

const PG_INTERNAL_PORT = 5433;

let app: INestApplication<App>;
let pgContainer: StartedTestContainer;
let authHelper: AuthHelper;
let seedHelper: SeedHelper;

export function getApp(): INestApplication<App> {
  return app;
}

export function getAuthHelper(): AuthHelper {
  return authHelper;
}

export function getSeedHelper(): SeedHelper {
  return seedHelper;
}

beforeAll(async () => {
  // 1. Start PostgreSQL testcontainer on port 5433 (not 5432, to never collide with dev DB)
  pgContainer = await new GenericContainer('postgres:12-alpine')
    .withEnvironment({
      POSTGRES_DB: 'testdb',
      POSTGRES_USER: 'testuser',
      POSTGRES_PASSWORD: 'testpass',
      PGPORT: PG_INTERNAL_PORT.toString(),
    })
    .withExposedPorts(PG_INTERNAL_PORT)
    .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
    .start();

  // 2. Override env vars BEFORE creating the module
  process.env.POSTGRES_HOST = pgContainer.getHost();
  process.env.POSTGRES_PORT = pgContainer.getMappedPort(PG_INTERNAL_PORT).toString();
  process.env.POSTGRES_USER = 'testuser';
  process.env.POSTGRES_PASSWORD = 'testpass';
  process.env.POSTGRES_DB = 'testdb';
  process.env.NODE_ENV = 'test';

  // 4. Create the module — AppModule reads env vars via ConfigService
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // 5. Synchronize schema in the testcontainer DB
  //    (app.module.ts has synchronize: false — we handle it here, not in prod code)
  const dataSource = moduleFixture.get(DataSource);
  await dataSource.synchronize(true);

  app = moduleFixture.createNestApplication();

  // Apply same config as main.ts
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '2',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  // Initialize helpers
  authHelper = new AuthHelper(app);
  seedHelper = new SeedHelper(app);

  // Seed base data
  await seedHelper.seedUsers();
}, 120_000);

afterAll(async () => {
  if (app) await app.close();
  if (pgContainer) await pgContainer.stop();
}, 30_000);
