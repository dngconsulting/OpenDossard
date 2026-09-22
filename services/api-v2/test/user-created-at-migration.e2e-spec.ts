import * as request from 'supertest';
import { DataSource, MigrationInterface } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { AddUserCreatedAtLastLogin1783000000000 } from '../src/migrations/1783000000000-AddUserCreatedAtLastLogin';
import { SetUserCreatedAtDefault1785000000000 } from '../src/migrations/1785000000000-SetUserCreatedAtDefault';

const API = '/api/v2/users';

interface CreatedAtRow {
  created_at: Date | null;
}

/**
 * Le schéma e2e sort de `synchronize()`, qui pose `DEFAULT now()` sur
 * `created_at` à partir des métadonnées `@CreateDateColumn`. La PROD, elle,
 * sort des MIGRATIONS — et la 1783 avait ajouté la colonne SANS default.
 * Or TypeORM n'écrit jamais la date lui-même : son INSERT envoie `DEFAULT`
 * et s'en remet à la base. Sans default en base → NULL, invisible en e2e.
 *
 * Ce spec rejoue donc le schéma des migrations sur les deux colonnes avant
 * de tester, pour vérifier ce que la PROD fait vraiment.
 */
describe('Migration user.created_at (e2e)', () => {
  let adminToken: string;
  let dataSource: DataSource;

  async function runMigration(
    migration: MigrationInterface,
    direction: 'up' | 'down' = 'up',
  ): Promise<void> {
    const qr = dataSource.createQueryRunner();
    try {
      await migration[direction](qr);
    } finally {
      await qr.release();
    }
  }

  async function createUserAndReadCreatedAt(email: string): Promise<Date | null> {
    const res = await request(getApp().getHttpServer())
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        password: 'password123',
        firstName: 'Créé',
        lastName: 'LE',
        roles: ['ORGANISATEUR'],
      })
      .expect(201);
    const rows: CreatedAtRow[] = await dataSource.query(
      'SELECT created_at FROM "user" WHERE id = $1',
      [(res.body as { id: number }).id],
    );
    return rows[0].created_at;
  }

  beforeAll(async () => {
    adminToken = getAuthHelper().getAdminToken();
    dataSource = getApp().get(DataSource);

    // Remplace le schéma `synchronize` par celui des migrations (= PROD).
    await dataSource.query(
      'ALTER TABLE "user" DROP COLUMN "created_at", DROP COLUMN "last_login_at"',
    );
    await runMigration(new AddUserCreatedAtLastLogin1783000000000());
  });

  afterEach(async () => {
    await getSeedHelper().cleanUsers();
  });

  it('sans la migration corrective, un user créé via POST /users a created_at NULL (le bug)', async () => {
    expect(await createUserAndReadCreatedAt('avant-fix@test.com')).toBeNull();
  });

  it('après la migration corrective, POST /users pose created_at', async () => {
    await runMigration(new SetUserCreatedAtDefault1785000000000());

    const createdAt = await createUserAndReadCreatedAt('apres-fix@test.com');

    // Pas de contrôle de fraîcheur : `timestamp` sans fuseau, lu en heure locale
    // par le driver alors que le conteneur tourne en UTC — l'écart n'est pas
    // significatif. Seule compte la présence de la date.
    expect(createdAt).toBeInstanceOf(Date);
  });

  it('down() retire le default et up() le repose (réversible)', async () => {
    const migration = new SetUserCreatedAtDefault1785000000000();

    await runMigration(migration, 'down');
    expect(await createUserAndReadCreatedAt('apres-down@test.com')).toBeNull();

    await runMigration(migration, 'up');
    expect(await createUserAndReadCreatedAt('apres-re-up@test.com')).not.toBeNull();
  });
});
