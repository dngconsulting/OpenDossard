import { DataSource } from 'typeorm';

import { getApp, getSeedHelper } from './setup-e2e';
import { MigrateFfcAgeCategories1789000000000 } from '../src/migrations/1789000000000-MigrateFfcAgeCategories';

/**
 * Les licences FFC portent des codes d'âge FSGT (PO, C, S, V…). La migration
 * les RENOMME dans la nomenclature FFC (U7…U23 / Senior / Master) sans jamais
 * recalculer depuis l'âge, et sans toucher aux autres fédés.
 */
describe('Migration catégories d’âge FFC (e2e)', () => {
  let dataSource: DataSource;

  async function run(direction: 'up' | 'down'): Promise<void> {
    const qr = dataSource.createQueryRunner();
    try {
      await new MigrateFfcAgeCategories1789000000000()[direction](qr);
    } finally {
      await qr.release();
    }
  }

  async function insertLicence(fede: string, gender: string, catea: string): Promise<number> {
    // Année de naissance volontairement incohérente avec la catégorie : la
    // migration ne doit pas en tenir compte.
    const rows: { id: number }[] = await dataSource.query(
      `INSERT INTO licence (name, first_name, fede, gender, birth_year, saison, catea)
       VALUES ('TEST', 'Test', $1, $2, '1950', '2025', $3) RETURNING id`,
      [fede, gender, catea],
    );
    return rows[0].id;
  }

  async function readCatea(id: number): Promise<string> {
    const rows: { catea: string }[] = await dataSource.query(
      'SELECT catea FROM licence WHERE id = $1',
      [id],
    );
    return rows[0].catea;
  }

  beforeAll(() => {
    dataSource = getApp().get(DataSource);
  });

  afterEach(async () => {
    await getSeedHelper().cleanLicences();
  });

  it.each([
    ['PUC', 'U7'],
    ['MO', 'U7'],
    ['PO', 'U9'],
    ['PU', 'U11'],
    ['B', 'U13'],
    ['M', 'U15'],
    ['C', 'U17'],
    ['J', 'U19'],
    ['E', 'U23'],
    ['S', 'Senior'],
    ['V', 'Master'],
    ['SV', 'Master'],
    ['A', 'Master'],
    ['SA', 'Master'],
    ['NC', 'NC'],
  ])('FFC homme : %s → %s, sans recalcul par l’âge', async (before, after) => {
    const id = await insertLicence('FFC', 'H', before);
    await run('up');
    expect(await readCatea(id)).toBe(after);
  });

  it('code neutre pour une femme FFC', async () => {
    const id = await insertLicence('FFC', 'F', 'FJ');
    await run('up');
    expect(await readCatea(id)).toBe('U19');
  });

  it('ne touche pas aux autres fédés', async () => {
    const fsgt = await insertLicence('FSGT', 'H', 'J');
    await run('up');
    expect(await readCatea(fsgt)).toBe('J');
  });

  it('down restaure les codes FSGT avec le préfixe de genre', async () => {
    const homme = await insertLicence('FFC', 'H', 'Master');
    const femme = await insertLicence('FFC', 'F', 'U19');
    await run('down');
    expect(await readCatea(homme)).toBe('V');
    expect(await readCatea(femme)).toBe('FJ');
  });
});
