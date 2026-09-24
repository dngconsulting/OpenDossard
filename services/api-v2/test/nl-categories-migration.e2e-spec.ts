import { DataSource } from 'typeorm';

import { getApp, getSeedHelper } from './setup-e2e';
import { ClearNonLicencieCategories1786000000000 } from '../src/migrations/1786000000000-ClearNonLicencieCategories';

interface CategoriesRow {
  fede: string;
  catea: string | null;
  catev: string | null;
  catev_cx: string | null;
}

/**
 * Les licences NL existantes portent encore des catégories de valeur et CX
 * saisies avant la règle « pas de catégorie réglementée pour un NL ».
 * La migration les nettoie sans toucher à la catégorie d'âge ni aux autres fédés.
 */
describe('Migration nettoyage des catégories NL (e2e)', () => {
  let dataSource: DataSource;

  async function runUp(): Promise<void> {
    const qr = dataSource.createQueryRunner();
    try {
      await new ClearNonLicencieCategories1786000000000().up(qr);
    } finally {
      await qr.release();
    }
  }

  async function readCategories(id: number): Promise<CategoriesRow> {
    const rows: CategoriesRow[] = await dataSource.query(
      'SELECT fede, catea, catev, catev_cx FROM licence WHERE id = $1',
      [id],
    );
    return rows[0];
  }

  beforeAll(() => {
    dataSource = getApp().get(DataSource);
  });

  afterEach(async () => {
    await getSeedHelper().cleanLicences();
  });

  it('vide catev et catev_cx des NL, conserve catea, ne touche pas aux autres fédés', async () => {
    const [nl, fsgt] = await getSeedHelper().seedLicences();
    // Simule une licence NL héritée (écrite avant la règle, donc hors service)
    await dataSource.query(`UPDATE licence SET fede = 'NL', catev_cx = '2' WHERE id = $1`, [nl.id]);
    await dataSource.query(`UPDATE licence SET catev_cx = '3' WHERE id = $1`, [fsgt.id]);

    await runUp();

    expect(await readCategories(nl.id)).toEqual({
      fede: 'NL',
      catea: 'S',
      catev: null,
      catev_cx: null,
    });
    expect(await readCategories(fsgt.id)).toEqual({
      fede: 'FSGT',
      catea: 'FS',
      catev: '3',
      catev_cx: '3',
    });
  });
});
