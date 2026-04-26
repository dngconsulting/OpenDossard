/**
 * One-shot migration script: imports users with role MOBILE from the backend
 * `user` table into Firebase Auth, preserving their bcrypt password hashes.
 *
 * Sets `firebase_uid` (= String(user.id)) and `sign_in_provider = 'password'`
 * on each successfully imported row, so that subsequent calls to
 * `/auth/firebase/exchange` find the mapping and emit backend tokens.
 *
 * Filters in SQL:
 *   - roles LIKE '%MOBILE%'  → only mobile users (backoffice ADMIN/ORGANIZER stay legacy)
 *   - firebase_uid IS NULL   → idempotency: never re-imports a row already migrated
 *   - password IS NOT NULL   → skip rows without bcrypt hash (user will use "forgot password" first time)
 *   - email IS NOT NULL      → skip rows without email (cannot create Firebase user)
 *
 * Required env vars:
 *   FIREBASE_SERVICE_ACCOUNT_JSON   — full SA JSON (stringified)
 *   POSTGRES_HOST / POSTGRES_PORT / POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
 *
 * Usage:
 *   npx ts-node scripts/migrate-users-to-firebase.ts --dry-run
 *   npx ts-node scripts/migrate-users-to-firebase.ts
 *
 * Exit codes:
 *   0 — all targeted users migrated (or none to migrate)
 *   1 — at least one user failed; details printed to stderr
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve, join } from 'path';
import { DataSource } from 'typeorm';

import { UserEntity } from '../src/users/entities/user.entity';

const BATCH = 500;
const TARGET_ROLE = 'MOBILE';
const IS_DRY_RUN = process.argv.includes('--dry-run');

// Load .env files in same precedence as Nest's ConfigModule (.env.local first, then .env)
const here = __dirname;
const envCandidates = [
  resolve(here, '../.env.local'),
  resolve(here, '../.env'),
];
for (const path of envCandidates) {
  if (existsSync(path)) {
    dotenv.config({ path, override: false });
  }
}

async function main() {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountRaw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var required');
  }

  // Lazy require — same hygiene as FirebaseModule (avoids accidental Jest pollution
  // if this script is ever required from a test context). Standalone CLI use is safe.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require('firebase-admin') as typeof import('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountRaw)),
  });

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER ?? 'dossarduser',
    password: process.env.POSTGRES_PASSWORD ?? 'dossardpassword',
    database: process.env.POSTGRES_DB ?? 'dossarddb',
    entities: [join(__dirname, '/../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: false,
  });
  await ds.initialize();
  const repo = ds.getRepository(UserEntity);

  // Pagination by lastId (NOT offset) — in live mode, each batch's successful
  // imports are removed from the result set by `firebase_uid IS NULL`, which
  // would shift offset-based pagination and skip users. lastId-based pagination
  // works for both dry-run and live without that shift.
  let lastId = 0;
  let okCount = 0;
  let failCount = 0;
  const errors: Array<{ id: number; reason: string }> = [];

  console.log(
    `=== Firebase users migration ${IS_DRY_RUN ? '(DRY RUN)' : '(LIVE)'} ===`,
  );
  console.log(`Target role: ${TARGET_ROLE}`);
  console.log(`Batch size : ${BATCH}`);
  console.log('');

  for (;;) {
    const users = await repo
      .createQueryBuilder('u')
      .where('u.roles LIKE :role', { role: `%${TARGET_ROLE}%` })
      .andWhere('u.firebase_uid IS NULL')
      .andWhere('u.password IS NOT NULL')
      .andWhere('u.email IS NOT NULL')
      .andWhere('u.id > :lastId', { lastId })
      .orderBy('u.id', 'ASC')
      .take(BATCH)
      .getMany();

    if (users.length === 0) break;

    const batchLastId = users[users.length - 1].id;

    if (IS_DRY_RUN) {
      console.log(
        `[DRY] would import batch of ${users.length} users (id range ${users[0].id}..${batchLastId})`,
      );
      lastId = batchLastId;
      continue;
    }

    const importPayload = users.map((u) => ({
      uid: String(u.id),
      email: u.email.toLowerCase().trim(),
      emailVerified: false,
      displayName:
        [u.firstName, u.lastName].filter(Boolean).join(' ') || undefined,
      passwordHash: Buffer.from(u.password!, 'utf8'),
    }));

    let res: import('firebase-admin').auth.UserImportResult;
    try {
      res = await admin.auth().importUsers(importPayload, {
        hash: { algorithm: 'BCRYPT' },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Batch ending at id=${batchLastId} failed entirely: ${msg}`);
      failCount += users.length;
      users.forEach((u) =>
        errors.push({ id: u.id, reason: `batch failure: ${msg}` }),
      );
      lastId = batchLastId;
      continue;
    }

    const failedIndexes = new Set(res.errors.map((e) => e.index));
    res.errors.forEach((e) => {
      errors.push({ id: users[e.index].id, reason: e.error.message });
    });

    const successfulUsers = users.filter((_, i) => !failedIndexes.has(i));

    if (successfulUsers.length > 0) {
      await repo
        .createQueryBuilder()
        .update(UserEntity)
        .set({
          firebaseUid: () => `CAST(id AS VARCHAR)`,
          signInProvider: 'password',
        })
        .whereInIds(successfulUsers.map((u) => u.id))
        .execute();
    }

    okCount += successfulUsers.length;
    failCount += res.errors.length;
    console.log(
      `Batch ending at id=${batchLastId}: ${successfulUsers.length} ok, ${res.errors.length} fail`,
    );
    lastId = batchLastId;
  }

  console.log('\n=== Migration done ===');
  console.log(`Success: ${okCount}`);
  console.log(`Failed : ${failCount}`);
  if (errors.length > 0) {
    console.error('\nDétails erreurs :');
    errors.forEach((e) =>
      console.error(`  user.id=${e.id} → ${e.reason}`),
    );
  }

  await ds.destroy();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
