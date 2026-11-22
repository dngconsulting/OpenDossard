import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { Federation } from '../src/common/enums';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number; hasMore: boolean };
}

type SummaryRow = Record<string, unknown> & { id: number; name: string; eventDate: string };

const API = '/api/v2/competitions/summaries';

/** Champs du résumé : tout ajout alourdit chaque ligne des listes mobiles. */
const SUMMARY_FIELDS = [
  'competitionType',
  'dept',
  'eventDate',
  'fede',
  'id',
  'lieuDossardGPS',
  'name',
  'onlineRegistrationEnabled',
  'zipCode',
];

describe('Competitions summaries (e2e)', () => {
  let adminToken: string;
  let mobileToken: string;

  const get = (query: Record<string, string | number> = {}, token = mobileToken) =>
    request(getApp().getHttpServer()).get(API).query(query).set('Authorization', `Bearer ${token}`);

  const names = async (query: Record<string, string | number>) => {
    const res = await get(query).expect(200);
    return (res.body as PaginatedResponse<SummaryRow>).data.map(c => c.name);
  };

  /** Recale les trois épreuves du seed sur des instants choisis. */
  const seedAt = async (dates: [Date, Date, Date]) => {
    const repo = getApp().get(DataSource).getRepository(CompetitionEntity);
    const [toulouse, auch, pyrenees] = await getSeedHelper().seedCompetitions();
    await repo.update({ id: toulouse.id }, { eventDate: dates[0] });
    await repo.update({ id: auch.id }, { eventDate: dates[1] });
    await repo.update({ id: pyrenees.id }, { eventDate: dates[2] });
  };

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanClubs();
  });

  it('renvoie uniquement les champs du résumé, avec la pagination', async () => {
    const { competitions } = await getSeedHelper().seedFullDataset();
    const repo = getApp().get(DataSource).getRepository(CompetitionEntity);
    await repo.update(
      { id: competitions[0].id },
      { lieuDossardGPS: '43.6,1.44', onlineRegistrationEnabled: true },
    );

    const res = await get().expect(200);
    const body = res.body as PaginatedResponse<SummaryRow>;

    expect(body.meta).toEqual({ total: 3, offset: 0, limit: 20, hasMore: false });
    expect(body.data).toHaveLength(3);
    for (const row of body.data) {
      expect(Object.keys(row).sort()).toEqual(SUMMARY_FIELDS);
    }
    expect(body.data[0]).toEqual({
      id: competitions[0].id,
      name: 'Grand Prix de Toulouse',
      eventDate: '2025-06-15T09:00:00.000Z',
      fede: Federation.FSGT,
      competitionType: 'ROUTE',
      zipCode: '31000',
      dept: '31',
      lieuDossardGPS: '43.6,1.44',
      onlineRegistrationEnabled: true,
    });
  });

  it('trie par date croissante par défaut, décroissante sur demande', async () => {
    await getSeedHelper().seedCompetitions();

    expect(await names({})).toEqual([
      'Grand Prix de Toulouse',
      'Gravel des Pyrénées',
      'Cyclo-cross de Auch',
    ]);
    expect(await names({ orderDirection: 'DESC' })).toEqual([
      'Cyclo-cross de Auch',
      'Gravel des Pyrénées',
      'Grand Prix de Toulouse',
    ]);
  });

  it('départage par nom les épreuves du même instant (pagination stable)', async () => {
    const sameInstant = new Date('2026-05-10T10:00:00Z');
    await seedAt([sameInstant, sameInstant, sameInstant]);

    const firstPage = await get({ limit: 2 }).expect(200);
    expect((firstPage.body as PaginatedResponse<SummaryRow>).meta.hasMore).toBe(true);
    expect([...(await names({ limit: 2 })), ...(await names({ limit: 2, offset: 2 }))]).toEqual([
      'Cyclo-cross de Auch',
      'Grand Prix de Toulouse',
      'Gravel des Pyrénées',
    ]);
  });

  it('filtre par plage de dates : jours en heure de Paris, bornes incluses', async () => {
    // Le jour d'une épreuve est celui affiché dans l'app (heure de Paris), pas
    // celui de l'horodatage UTC : une épreuve saisie à minuit le 1er juin est
    // stockée la veille à 22 h UTC et doit rester une épreuve du 1er juin.
    await seedAt([
      new Date('2026-05-31T22:00:00Z'), // 1er juin 00:00 à Paris
      new Date('2026-06-01T21:59:00Z'), // 1er juin 23:59 à Paris
      new Date('2026-06-01T22:00:00Z'), // 2 juin 00:00 à Paris
    ]);

    expect(await names({ startDate: '2026-06-01', endDate: '2026-06-01' })).toEqual([
      'Grand Prix de Toulouse',
      'Cyclo-cross de Auch',
    ]);
    expect(await names({ startDate: '2026-06-02' })).toEqual(['Gravel des Pyrénées']);
    expect(await names({ endDate: '2026-05-31' })).toEqual([]);
  });

  it("garde le jour de Paris en heure d'hiver", async () => {
    await seedAt([
      new Date('2026-12-05T23:00:00Z'), // 6 décembre 00:00 à Paris
      new Date('2026-12-06T11:00:00Z'), // 6 décembre 12:00 à Paris
      new Date('2026-12-06T23:00:00Z'), // 7 décembre 00:00 à Paris
    ]);

    expect(await names({ startDate: '2026-12-06', endDate: '2026-12-06' })).toEqual([
      'Grand Prix de Toulouse',
      'Cyclo-cross de Auch',
    ]);
  });

  it('filtre par fédérations, types et départements', async () => {
    await getSeedHelper().seedCompetitions();

    expect(await names({ fedes: 'FFC' })).toEqual(['Gravel des Pyrénées']);
    expect(await names({ fedes: 'FSGT,FFC' })).toHaveLength(3);
    expect(await names({ competitionTypes: 'CX,GRAVEL' })).toEqual([
      'Gravel des Pyrénées',
      'Cyclo-cross de Auch',
    ]);
    expect(await names({ depts: '31,32' })).toEqual([
      'Grand Prix de Toulouse',
      'Gravel des Pyrénées',
    ]);
  });

  it('recherche sur le nom ou le code postal', async () => {
    await getSeedHelper().seedCompetitions();

    expect(await names({ search: 'gravel' })).toEqual(['Gravel des Pyrénées']);
    expect(await names({ search: '32000' })).toEqual(['Cyclo-cross de Auch']);
  });

  it('est accessible aux rôles MOBILE et ADMIN, pas sans authentification', async () => {
    await get({}, mobileToken).expect(200);
    await get({}, adminToken).expect(200);
    await request(getApp().getHttpServer()).get(API).expect(401);
  });

  it('refuse une date invalide', async () => {
    await get({ startDate: 'pas-une-date' }).expect(400);
    await get({ endDate: '2026-02-30' }).expect(400);
  });

  it('refuse une fédération ou un type inconnu (400, pas une erreur serveur)', async () => {
    await get({ fedes: 'FSGT,XXX' }).expect(400);
    await get({ competitionTypes: 'PETANQUE' }).expect(400);
  });

  it('traite % et _ de la recherche comme des caractères ordinaires', async () => {
    await getSeedHelper().seedCompetitions();

    expect(await names({ search: '_' })).toEqual([]);
    expect(await names({ search: '%' })).toEqual([]);
    expect(await names({ search: 'Grand%Toulouse' })).toEqual([]);
  });
});
