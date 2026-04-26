/**
 * Smoke test manuel des endpoints /auth/firebase/* contre l'API en local +
 * le projet Firebase `dossardeur-test`.
 *
 * Pré-requis :
 *   - API tournant sur http://localhost:3500 (`npm run start` avec
 *     FIREBASE_SERVICE_ACCOUNT_JSON exporté)
 *   - DB postgres locale (`dossarddb`) avec migration `firebase_uid` appliquée
 *   - SA Firebase à `~/.config/firebase/dossardeur-test-sa.json`
 *
 * Crée un user Firebase jetable, déroule les scénarios, supprime le user
 * Firebase + la ligne backend en cleanup.
 *
 * Usage : `npx ts-node test/manual/smoke-firebase-auth.ts`
 */

import 'reflect-metadata';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { resolve, join } from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

const SA_PATH = join(homedir(), '.config/firebase/dossardeur-test-sa.json');
// API key publique du projet dossardeur-test (extraite de config/firebase/test/google-services.json,
// platform Android — fonctionne aussi pour Identity Toolkit REST). C'est une clé publique
// embarquée dans tous les builds mobile, pas un secret.
const WEB_API_KEY = 'AIzaSyAY5ru3foIGaBhJDAOL8JKMVj8PIYgmd2s';
const API_BASE = process.env.API_BASE ?? 'http://localhost:3500/api/v2';

// Load .env for postgres credentials (cleanup)
for (const path of [
  resolve(__dirname, '../../.env.local'),
  resolve(__dirname, '../../.env'),
]) {
  if (existsSync(path)) dotenv.config({ path, override: false });
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  if (!existsSync(SA_PATH)) {
    throw new Error(`SA file missing at ${SA_PATH}`);
  }
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = readFileSync(SA_PATH, 'utf-8');
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin') as typeof import('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!),
  ),
});

const TEST_EMAIL = `smoke-${Date.now()}@dossardeur.local`;
const OTHER_EMAIL = `smoke-other-${Date.now()}@dossardeur.local`;
const TEST_PWD = 'SmokeTest!1234';

let testUid: string | undefined;
let otherUid: string | undefined;

async function signInWithPassword(
  email: string,
  password: string,
): Promise<string> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) {
    throw new Error(`signInWithPassword ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { idToken: string };
  return data.idToken;
}

async function api(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: any }> {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`✅ ${label}`);
    pass++;
  } else {
    console.error(`❌ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

async function main() {
  // Wait for API
  console.log(`Polling API at ${API_BASE} ...`);
  const start = Date.now();
  let apiReady = false;
  while (Date.now() - start < 30_000) {
    try {
      const r = await fetch(API_BASE + '/docs-json');
      if (r.ok) {
        apiReady = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!apiReady) {
    throw new Error('API not reachable within 30s');
  }
  console.log('API up.\n');

  // Create test Firebase user
  console.log(`Creating Firebase user ${TEST_EMAIL}`);
  const u = await admin.auth().createUser({
    email: TEST_EMAIL,
    password: TEST_PWD,
  });
  testUid = u.uid;

  const idToken = await signInWithPassword(TEST_EMAIL, TEST_PWD);

  // === Scenarios ===

  // S1: register fresh
  let res = await api('POST', '/auth/firebase/register', {
    idToken,
    firstName: 'Smoke',
    lastName: 'Test',
  });
  check(
    'S1: register fresh user → 201',
    res.status === 201,
    `got ${res.status} ${JSON.stringify(res.body)}`,
  );
  check('S1: has accessToken', !!res.body?.accessToken);
  check('S1: has refreshToken', !!res.body?.refreshToken);
  check('S1: user.email matches', res.body?.user?.email === TEST_EMAIL);

  // S2: register same idToken twice → 409
  res = await api('POST', '/auth/firebase/register', {
    idToken,
    firstName: 'Smoke',
    lastName: 'Test',
  });
  check(
    'S2: re-register same user → 409',
    res.status === 409,
    `got ${res.status}`,
  );

  // S3: exchange after register → 200
  res = await api('POST', '/auth/firebase/exchange', { idToken });
  check(
    'S3: exchange after register → 200',
    res.status === 200,
    `got ${res.status}`,
  );
  check('S3: tokens emitted', !!res.body?.accessToken);
  check('S3: roles include MOBILE', res.body?.user?.roles?.includes('MOBILE'));

  // S4: exchange of unregistered Firebase user → 403
  console.log(`Creating second Firebase user ${OTHER_EMAIL} (not registered)`);
  const u2 = await admin.auth().createUser({
    email: OTHER_EMAIL,
    password: TEST_PWD,
  });
  otherUid = u2.uid;
  const otherIdToken = await signInWithPassword(OTHER_EMAIL, TEST_PWD);
  res = await api('POST', '/auth/firebase/exchange', { idToken: otherIdToken });
  check(
    'S4: exchange of unregistered user → 403',
    res.status === 403,
    `got ${res.status}`,
  );

  // S5: missing idToken → 400 (class-validator)
  res = await api('POST', '/auth/firebase/exchange', {});
  check('S5: missing idToken → 400', res.status === 400, `got ${res.status}`);

  // S6: register missing firstName → 400
  res = await api('POST', '/auth/firebase/register', {
    idToken: otherIdToken,
    lastName: 'NoFirstName',
  });
  check(
    'S6: register missing firstName → 400',
    res.status === 400,
    `got ${res.status}`,
  );

  // S7: invalid idToken (signature/format) → 401
  res = await api('POST', '/auth/firebase/exchange', {
    idToken: 'totally-not-a-token',
  });
  check(
    'S7: invalid idToken → 401',
    res.status === 401,
    `got ${res.status}`,
  );
}

async function cleanup() {
  console.log('\n=== Cleanup ===');

  if (testUid) {
    try {
      await admin.auth().deleteUser(testUid);
      console.log(`Firebase user ${TEST_EMAIL} deleted`);
    } catch (e: unknown) {
      console.error(`Failed to delete ${TEST_EMAIL}:`, e);
    }
  }
  if (otherUid) {
    try {
      await admin.auth().deleteUser(otherUid);
      console.log(`Firebase user ${OTHER_EMAIL} deleted`);
    } catch (e: unknown) {
      console.error(`Failed to delete ${OTHER_EMAIL}:`, e);
    }
  }

  // Cleanup backend row from S1
  try {
    const ds = new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? 'dossarduser',
      password: process.env.POSTGRES_PASSWORD ?? 'dossardpassword',
      database: process.env.POSTGRES_DB ?? 'dossarddb',
      entities: [],
      synchronize: false,
      logging: false,
    });
    await ds.initialize();
    const result = await ds.query(
      'DELETE FROM "user" WHERE email = $1 OR email = $2',
      [TEST_EMAIL, OTHER_EMAIL],
    );
    console.log(`Backend rows deleted: ${result?.[1] ?? 0}`);
    await ds.destroy();
  } catch (e: unknown) {
    console.error('Backend cleanup failed:', e);
  }
}

main()
  .catch((e) => {
    console.error('\nSMOKE TEST CRASHED:', e);
    fail++;
  })
  .finally(async () => {
    await cleanup();
    console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`);
    process.exit(fail > 0 ? 1 : 0);
  });
