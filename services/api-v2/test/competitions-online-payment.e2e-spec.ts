import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { ClubEntity } from '../src/clubs/entities/club.entity';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { cleanHelloAssoLinks, seedHelloAssoLink } from './helpers/helloasso-link.seed';
import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';

const API = '/api/v2/competitions';

/**
 * Verrou d'activation du paiement en ligne : l'API refuse d'ACTIVER le
 * paiement HelloAsso d'une épreuve si le club n'est pas lié ou si son drapeau
 * `isCashInCompliant` n'est pas `true` — y compris pour un ADMIN.
 */
describe('Competitions — verrou d’activation du paiement en ligne (e2e)', () => {
  let dataSource: DataSource;
  let adminToken: string;
  let club: ClubEntity;

  beforeAll(() => {
    dataSource = getApp().get(DataSource);
    adminToken = getAuthHelper().getAdminToken();
  });

  beforeEach(async () => {
    [club] = await getSeedHelper().seedClubs();
  });

  afterEach(async () => {
    const clubIds = (await dataSource.getRepository(ClubEntity).find()).map(c => c.id);
    await cleanHelloAssoLinks(dataSource, clubIds);
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanClubs();
  });

  async function linkClub(isCashInCompliant: boolean | null): Promise<void> {
    await seedHelloAssoLink(dataSource, {
      clubId: club.id,
      organizationSlug: `orga-verrou-${club.id}`,
      isCashInCompliant,
    });
  }

  async function seedCompetition(onlineRegistrationEnabled: boolean): Promise<CompetitionEntity> {
    const [competition] = await getSeedHelper().seedCompetitions([club]);
    await dataSource
      .getRepository(CompetitionEntity)
      .update({ id: competition.id }, { onlineRegistrationEnabled });
    return competition;
  }

  function patch(id: number, body: Partial<CompetitionEntity>) {
    return request(getApp().getHttpServer())
      .patch(`${API}/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
  }

  async function storedOnline(id: number): Promise<boolean> {
    const competition = await dataSource
      .getRepository(CompetitionEntity)
      .findOneOrFail({ where: { id } });
    return competition.onlineRegistrationEnabled;
  }

  it('POST à ON pour un club non conforme → 422 (ADMIN compris)', async () => {
    await linkClub(false);

    await request(getApp().getHttpServer())
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Course paiement en ligne',
        eventDate: '2026-11-01T09:00:00Z',
        zipCode: '82100',
        categories: '1,2',
        races: '1,2',
        clubId: club.id,
        onlineRegistrationEnabled: true,
      })
      .expect(422);
  });

  it('PATCH OFF → ON pour un club non conforme → 422, épreuve inchangée', async () => {
    await linkClub(false);
    const competition = await seedCompetition(false);

    await patch(competition.id, { onlineRegistrationEnabled: true }).expect(422);

    expect(await storedOnline(competition.id)).toBe(false);
  });

  it('PATCH OFF → ON pour un club au statut inconnu (null) → 422', async () => {
    await linkClub(null);
    const competition = await seedCompetition(false);

    await patch(competition.id, { onlineRegistrationEnabled: true }).expect(422);
  });

  it('PATCH OFF → ON pour un club conforme → 200', async () => {
    await linkClub(true);
    const competition = await seedCompetition(false);

    await patch(competition.id, { onlineRegistrationEnabled: true }).expect(200);

    expect(await storedOnline(competition.id)).toBe(true);
  });

  it('épreuve déjà à ON, club non conforme : éditer un autre champ → 200', async () => {
    await linkClub(false);
    const competition = await seedCompetition(true);

    await patch(competition.id, { name: 'GP renommé', onlineRegistrationEnabled: true }).expect(
      200,
    );

    expect(await storedOnline(competition.id)).toBe(true);
  });

  it('PATCH ON → OFF pour un club non conforme → 200', async () => {
    await linkClub(false);
    const competition = await seedCompetition(true);

    await patch(competition.id, { onlineRegistrationEnabled: false }).expect(200);

    expect(await storedOnline(competition.id)).toBe(false);
  });
});
