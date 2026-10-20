import { DataSource, MigrationInterface } from 'typeorm';

import { SplitHelloAssoOrganization1792000000000 } from '../src/migrations/1792000000000-SplitHelloAssoOrganization';
import { getApp } from './setup-e2e';

interface OrgRow {
  organization_slug: string;
  refresh_token: string;
  is_cash_in_compliant: boolean | null;
  last_refreshed_at: Date | null;
}

interface LinkRow {
  club_id: number;
  organization_slug: string;
  linked_by_user_id: number | null;
}

/**
 * Le schéma e2e sort de `synchronize()` (déjà au nouveau modèle). La PROD sort
 * des migrations : ce spec reconstitue l'ancienne table `helloasso_details`
 * (migrations 1778 + 1779700), la remplit, puis joue la 1792 dans les deux
 * sens — ce qui tournera réellement au boot.
 */
describe('Migration 1792 — orga HelloAsso séparée du rattachement club (e2e)', () => {
  let dataSource: DataSource;
  const migration = new SplitHelloAssoOrganization1792000000000();

  /** Dans une transaction, comme au boot (`migrationsTransactionMode: 'each'`). */
  async function run(m: MigrationInterface, direction: 'up' | 'down'): Promise<void> {
    const qr = dataSource.createQueryRunner();
    await qr.startTransaction();
    try {
      await m[direction](qr);
      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async function insertOldLink(
    clubId: number,
    slug: string,
    rt: string,
    compliant: boolean | null,
  ) {
    await dataSource.query(
      `INSERT INTO helloasso_details
         (club_id, organization_slug, access_token, refresh_token, access_token_expires_at,
          refresh_token_expires_at, linked_by_user_id, linked_at, last_refreshed_at,
          is_cash_in_compliant)
       VALUES ($1, $2, 'iv.tag.at', $3, now(), now() + interval '20 days', NULL, now(),
               now() - interval '1 day', $4)`,
      [clubId, slug, rt, compliant],
    );
  }

  beforeAll(async () => {
    dataSource = getApp().get(DataSource);
    // Schéma PROD avant la 1792 (sans FK club/user : absentes du schéma e2e).
    await dataSource.query('DROP TABLE IF EXISTS "helloasso_details" CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS "helloasso_organization" CASCADE');
    await dataSource.query(`
      CREATE TABLE "helloasso_details" (
        "id" SERIAL PRIMARY KEY,
        "club_id" INTEGER NOT NULL,
        "organization_slug" VARCHAR(255) NOT NULL,
        "access_token" TEXT NOT NULL,
        "refresh_token" TEXT NOT NULL,
        "access_token_expires_at" TIMESTAMP NOT NULL,
        "refresh_token_expires_at" TIMESTAMP NOT NULL,
        "linked_by_user_id" INTEGER NULL,
        "linked_at" TIMESTAMP NOT NULL,
        "last_refreshed_at" TIMESTAMP NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_cash_in_compliant" BOOLEAN NULL,
        CONSTRAINT "UQ_helloasso_details_club_id" UNIQUE ("club_id"),
        CONSTRAINT "UQ_helloasso_details_organization_slug" UNIQUE ("organization_slug")
      )
    `);
    await dataSource.query(
      `CREATE INDEX "IDX_helloasso_details_access_expires" ON "helloasso_details" ("access_token_expires_at")`,
    );
    await insertOldLink(9001, 'orga-migration-a', 'RT_A', true);
    await insertOldLink(9002, 'orga-migration-b', 'RT_B', null);
  });

  afterAll(async () => {
    // Base partagée entre fichiers : si un test a échoué avant le dernier `up`,
    // remettre le nouveau modèle pour ne pas casser les specs suivantes.
    const [{ org }]: { org: string | null }[] = await dataSource.query(
      `SELECT to_regclass('helloasso_organization') AS org`,
    );
    if (org === null) {
      await run(migration, 'up');
    }
    // Le schéma partagé doit rester au nouveau modèle, vide de nos lignes.
    await dataSource.query('DELETE FROM helloasso_details WHERE club_id IN (9001, 9002, 9003)');
    await dataSource.query(
      `DELETE FROM helloasso_organization WHERE organization_slug LIKE 'orga-migration-%'`,
    );
  });

  it('up : une orga par slug avec sa chaîne, chaque club rattaché à la sienne', async () => {
    await run(migration, 'up');

    const orgs: OrgRow[] = await dataSource.query(
      `SELECT organization_slug, refresh_token, is_cash_in_compliant, last_refreshed_at
       FROM helloasso_organization ORDER BY organization_slug`,
    );
    expect(orgs.map(o => [o.organization_slug, o.refresh_token, o.is_cash_in_compliant])).toEqual([
      ['orga-migration-a', 'RT_A', true],
      ['orga-migration-b', 'RT_B', null],
    ]);
    expect(orgs.every(o => o.last_refreshed_at !== null)).toBe(true);

    const links: LinkRow[] = await dataSource.query(
      `SELECT d.club_id, o.organization_slug, d.linked_by_user_id
       FROM helloasso_details d JOIN helloasso_organization o ON o.id = d.organization_id
       ORDER BY d.club_id`,
    );
    expect(links.map(l => [l.club_id, l.organization_slug])).toEqual([
      [9001, 'orga-migration-a'],
      [9002, 'orga-migration-b'],
    ]);
  });

  it('après up, un 2e club peut se rattacher à une orga existante', async () => {
    await dataSource.query(
      `INSERT INTO helloasso_details (club_id, organization_id, linked_at)
       SELECT 9003, id, now() FROM helloasso_organization WHERE organization_slug = 'orga-migration-a'`,
    );
    const [{ count }]: { count: string }[] = await dataSource.query(
      `SELECT count(*) FROM helloasso_details d JOIN helloasso_organization o ON o.id = d.organization_id
       WHERE o.organization_slug = 'orga-migration-a'`,
    );
    expect(Number(count)).toBe(2);
  });

  it('down refuse de revenir en arrière tant qu’une orga est partagée', async () => {
    await expect(run(migration, 'down')).rejects.toThrow();
  });

  it('down sans orga partagée restaure l’ancienne table, up la resépare', async () => {
    await dataSource.query('DELETE FROM helloasso_details WHERE club_id = 9003');

    await run(migration, 'down');
    const old: { club_id: number; organization_slug: string; refresh_token: string }[] =
      await dataSource.query(
        `SELECT club_id, organization_slug, refresh_token FROM helloasso_details ORDER BY club_id`,
      );
    expect(old.map(r => [r.club_id, r.organization_slug, r.refresh_token])).toEqual([
      [9001, 'orga-migration-a', 'RT_A'],
      [9002, 'orga-migration-b', 'RT_B'],
    ]);

    await run(migration, 'up');
    const [{ count }]: { count: string }[] = await dataSource.query(
      'SELECT count(*) FROM helloasso_organization',
    );
    expect(Number(count)).toBe(2);
  });
});
