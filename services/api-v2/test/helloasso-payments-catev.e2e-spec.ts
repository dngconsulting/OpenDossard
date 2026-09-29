import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { Federation } from '../src/common/enums';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from '../src/helloasso/entities/helloasso-payment.entity';
import { LicenceEntity } from '../src/licences/entities/licence.entity';

const API = '/api/v2/helloasso/payments';

interface CatevRow {
  licenceName: string | null;
  catev: string | null;
}

/**
 * Catégorie de valeur des pré-inscrits : sur une épreuve CX, catégorie CX de la
 * licence (vide si absente) ; sur une épreuve route, catégorie route.
 */
describe('Pré-inscrits HelloAsso : catégorie selon le type d’épreuve (e2e)', () => {
  let adminToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getApp().get(DataSource).query('TRUNCATE TABLE "helloasso_payment" CASCADE');
    await getSeedHelper().cleanLicences();
    await getSeedHelper().cleanCompetitions();
  });

  /** [0] épreuve route, [1] épreuve CX (cf. seedCompetitions). */
  async function seed() {
    const ds = getApp().get(DataSource);
    const [route, cx] = await getSeedHelper().seedCompetitions();
    const licenceRepo = ds.getRepository(LicenceEntity);
    const [avecCx, sansCx] = await licenceRepo.save(
      [
        // Route 5 > route 4 de SANSCX : le tri par catégorie route donnerait l'ordre inverse.
        { name: 'AVECCX', catev: '5', catevCX: '3' },
        { name: 'SANSCX', catev: '4', catevCX: null },
      ].map((l, i) =>
        licenceRepo.create({
          ...l,
          firstName: 'Test',
          licenceNumber: `8000000${i}`,
          gender: 'H',
          club: 'VC Test',
          dept: '31',
          birthYear: '1985',
          catea: 'S',
          fede: Federation.FSGT,
          saison: '2025',
        } as Partial<LicenceEntity>),
      ),
    );
    const paymentRepo = ds.getRepository(HelloAssoPaymentEntity);
    await paymentRepo.save(
      [
        [cx.id, avecCx.id],
        [cx.id, sansCx.id],
        [route.id, avecCx.id],
      ].map(([competitionId, licenceId]) =>
        paymentRepo.create({
          competitionId,
          licenceId,
          status: HelloAssoPaymentStatus.PAID,
          tarifId: 'Adulte',
          amountCents: 1000,
          paidAt: new Date('2025-06-01T10:00:00Z'),
        }),
      ),
    );
    return { route, cx };
  }

  const byName = (rows: CatevRow[]): Record<string, string | null> =>
    Object.fromEntries(rows.map(r => [r.licenceName ?? '', r.catev]));

  it('vue mobile : catégorie CX sur une épreuve CX (vide si absente), route sinon', async () => {
    const { route, cx } = await seed();

    const cxRes = await request(getApp().getHttpServer())
      .get(`${API}/competition/${cx.id}`)
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(200);
    expect(byName(cxRes.body as CatevRow[])).toEqual({ AVECCX: '3', SANSCX: null });

    const routeRes = await request(getApp().getHttpServer())
      .get(`${API}/competition/${route.id}`)
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(200);
    expect(byName(routeRes.body as CatevRow[])).toEqual({ AVECCX: '5' });
  });

  it('vue admin : même règle dans la colonne, le filtre et le tri', async () => {
    const { cx } = await seed();
    const get = (query: Record<string, string> = {}) =>
      request(getApp().getHttpServer())
        .get(`${API}/admin/competition/${cx.id}`)
        .query(query)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

    const all = (await get()).body as { data: CatevRow[] };
    expect(byName(all.data)).toEqual({ AVECCX: '3', SANSCX: null });

    const filtered = (await get({ catev: '3' })).body as { data: CatevRow[] };
    expect(filtered.data.map(r => r.licenceName)).toEqual(['AVECCX']);

    const sorted = (await get({ orderBy: 'catev', orderDirection: 'ASC' })).body as {
      data: CatevRow[];
    };
    expect(sorted.data.map(r => r.licenceName)).toEqual(['AVECCX', 'SANSCX']);
  });
});
