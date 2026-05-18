import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve, join } from 'path';
import { DataSource } from 'typeorm';

// Load .env files in same precedence as Nest's ConfigModule (.env.local first, then .env).
// Required because the TypeORM CLI runs outside the Nest runtime and doesn't go through ConfigModule.
const envCandidates = [
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../.env'),
];
for (const path of envCandidates) {
  if (existsSync(path)) {
    dotenv.config({ path, override: false });
  }
}

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'dossarduser',
  password: process.env.POSTGRES_PASSWORD ?? 'dossardpassword',
  database: process.env.POSTGRES_DB ?? 'dossarddb',
  entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
