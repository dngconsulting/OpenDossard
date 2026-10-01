import { Logger } from '@nestjs/common';
import { DataSource, MigrationInterface } from 'typeorm';

import { getApp, getSeedHelper } from './setup-e2e';
import { SplitUserPhoneOrganisation1788000000000 } from '../src/migrations/1788000000000-SplitUserPhoneOrganisation';

interface Row {
  email: string;
  phone: string | null;
  organisation: string | null;
}

/**
 * Le schéma e2e sort de `synchronize()`, qui crée déjà `organisation` vide.
 * On la supprime pour repartir de l'état PROD d'avant migration, on insère
 * les formes réellement observées en PROD (2026-09-30) plus un cas mixte
 * inventé (filet de sécurité) et des cas limites de blancs, puis on rejoue
 * up() et down().
 */
describe('Migration user.organisation (e2e)', () => {
  let dataSource: DataSource;
  const migration = new SplitUserPhoneOrganisation1788000000000();

  async function run(m: MigrationInterface, direction: 'up' | 'down'): Promise<void> {
    const qr = dataSource.createQueryRunner();
    try {
      await m[direction](qr);
    } finally {
      await qr.release();
    }
  }

  async function insert(email: string, phone: string | null): Promise<void> {
    await dataSource.query(
      `INSERT INTO "user" (email, first_name, last_name, roles, phone)
       VALUES ($1, 'Mig', 'TEST', 'ORGANISATEUR', $2)`,
      [email, phone],
    );
  }

  async function read(): Promise<Record<string, Row>> {
    const rows: Row[] = await dataSource.query(
      `SELECT email, phone, organisation FROM "user" WHERE email LIKE 'mig-%' ORDER BY email`,
    );
    return Object.fromEntries(rows.map(r => [r.email, r]));
  }

  beforeAll(async () => {
    dataSource = getApp().get(DataSource);
    await dataSource.query('ALTER TABLE "user" DROP COLUMN "organisation"');
    await insert('mig-1-tel-club@test.com', '0612345678 TOAC Cyclisme');
    await insert('mig-2-club-seul@test.com', 'Lavaur Vélo-Club');
    await insert('mig-3-comite-dept@test.com', '0561000000 Comité FSGT 31');
    await insert('mig-4-mixte@test.com', 'Club 06 12 34 56 78');
    await insert('mig-5-null@test.com', null);
    await insert('mig-6-club-chiffres@test.com', 'Montauban Cyclisme 82');
    await insert('mig-7-vide@test.com', '');
    await insert('mig-8-blancs@test.com', '   ');
    await insert('mig-9-multi-espaces@test.com', '  0612345678   Balma Olympique Cyclisme  ');
  });

  afterAll(async () => {
    await getSeedHelper().cleanUsers();
  });

  it('up() découpe numéro et organisation selon la règle stricte', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn');
    try {
      await run(migration, 'up');
      // Seul mig-4 reste hors format « 10 chiffres » : NULL, '' et blancs ne comptent pas.
      const migrationWarnings = warn.mock.calls.filter(([msg]) =>
        String(msg).includes('valeur(s) de phone'),
      );
      expect(migrationWarnings).toHaveLength(1);
      expect(String(migrationWarnings[0][0])).toContain('1 valeur');
    } finally {
      warn.mockRestore();
    }
    const r = await read();

    expect(r['mig-1-tel-club@test.com']).toMatchObject({
      phone: '0612345678',
      organisation: 'TOAC Cyclisme',
    });
    expect(r['mig-2-club-seul@test.com']).toMatchObject({
      phone: null,
      organisation: 'Lavaur Vélo-Club',
    });
    expect(r['mig-3-comite-dept@test.com']).toMatchObject({
      phone: '0561000000',
      organisation: 'Comité FSGT 31',
    });
    // Cas mixte non reconnu : laissé intact, rien deviné.
    expect(r['mig-4-mixte@test.com']).toMatchObject({
      phone: 'Club 06 12 34 56 78',
      organisation: null,
    });
    expect(r['mig-5-null@test.com']).toMatchObject({ phone: null, organisation: null });
    expect(r['mig-6-club-chiffres@test.com']).toMatchObject({
      phone: null,
      organisation: 'Montauban Cyclisme 82',
    });
    expect(r['mig-7-vide@test.com']).toMatchObject({ phone: '', organisation: null });
    expect(r['mig-8-blancs@test.com']).toMatchObject({ phone: '   ', organisation: null });
    expect(r['mig-9-multi-espaces@test.com']).toMatchObject({
      phone: '0612345678',
      organisation: 'Balma Olympique Cyclisme',
    });
  });

  it("down() recolle le format d'origine aux espaces près, puis up() redécoupe", async () => {
    await run(migration, 'down');
    const afterDown: Row[] = await dataSource.query(
      `SELECT email, phone FROM "user" WHERE email LIKE 'mig-%' ORDER BY email`,
    );
    expect(afterDown.map(b => b.phone)).toEqual([
      '0612345678 TOAC Cyclisme',
      'Lavaur Vélo-Club',
      '0561000000 Comité FSGT 31',
      'Club 06 12 34 56 78',
      null,
      'Montauban Cyclisme 82',
      '',
      '   ',
      // up() a normalisé les blancs : pas de retour à l'identique.
      '0612345678 Balma Olympique Cyclisme',
    ]);

    // Restaure la colonne pour les specs suivants.
    await run(migration, 'up');
    expect((await read())['mig-1-tel-club@test.com'].organisation).toBe('TOAC Cyclisme');
  });
});
