import { DataSource } from 'typeorm';

import { getApp, getSeedHelper } from './setup-e2e';
import { ClearInvalidFfcCatev1790000000000 } from '../src/migrations/1790000000000-ClearInvalidFfcCatev';

interface CatevRow {
  catev: string | null;
  catev_cx: string | null;
}

/**
 * Les licences FFC portent des catégories de valeur héritées d'autres fédés
 * (1…5, C, M, PO…). La migration les vide, garde les valeurs FFC valides et
 * ne touche pas aux autres fédés.
 */
describe('Migration nettoyage des catev FFC (e2e)', () => {
  let dataSource: DataSource;

  async function runUp(): Promise<void> {
    const qr = dataSource.createQueryRunner();
    try {
      await new ClearInvalidFfcCatev1790000000000().up(qr);
    } finally {
      await qr.release();
    }
  }

  async function insertLicence(
    fede: string,
    catev: string | null,
    catevCx: string | null,
  ): Promise<number> {
    const rows: { id: number }[] = await dataSource.query(
      `INSERT INTO licence (name, first_name, fede, gender, catev, catev_cx)
       VALUES ('TEST', 'Test', $1, 'H', $2, $3) RETURNING id`,
      [fede, catev, catevCx],
    );
    return rows[0].id;
  }

  async function readCatev(id: number): Promise<CatevRow> {
    const rows: CatevRow[] = await dataSource.query(
      'SELECT catev, catev_cx FROM licence WHERE id = $1',
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

  it.each(['1', '4', 'C', 'M', 'J', 'PO', 'MO', 'PASSOPEN', 'PASSCYCLISME', 'DAMES', ''])(
    'vide la catev FFC invalide « %s » (route et CX)',
    async invalid => {
      const id = await insertLicence('FFC', invalid, invalid);
      await runUp();
      expect(await readCatev(id)).toEqual({ catev: null, catev_cx: null });
    },
  );

  it.each(['ELITE', 'OPEN1VTT', 'OPEN3', 'U19', 'U7', 'ACCESS4', 'MASSE'])(
    'conserve la catev FFC valide « %s »',
    async valid => {
      const id = await insertLicence('FFC', valid, valid);
      await runUp();
      expect(await readCatev(id)).toEqual({ catev: valid, catev_cx: valid });
    },
  );

  it('traite route et CX indépendamment', async () => {
    const id = await insertLicence('FFC', 'OPEN2', 'C');
    await runUp();
    expect(await readCatev(id)).toEqual({ catev: 'OPEN2', catev_cx: null });
  });

  it('ne touche pas aux autres fédés', async () => {
    const fsgt = await insertLicence('FSGT', '3', 'C');
    await runUp();
    expect(await readCatev(fsgt)).toEqual({ catev: '3', catev_cx: 'C' });
  });
});
