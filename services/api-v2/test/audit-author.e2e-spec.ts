import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { LicenceEntity } from '../src/licences/entities/licence.entity';
import { RaceEntity } from '../src/races/entities/race.entity';

/**
 * Vérifie que les colonnes d'audit (author, lastChanged) sont posées par le
 * serveur sur chaque create/update des tables club / competition / race, et
 * qu'elles ne peuvent pas être forgées depuis le body.
 *
 * L'email d'audit doit toujours venir du JWT (`@CurrentUser('email')`), jamais
 * du body de la requête.
 */
describe('Audit author / lastChanged (e2e)', () => {
  let adminToken: string;
  let clubs: ClubEntity[];
  let competitions: CompetitionEntity[];
  let licences: LicenceEntity[];

  const ADMIN_EMAIL = 'admin@test.com';

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  beforeEach(async () => {
    const dataset = await getSeedHelper().seedFullDataset();
    clubs = dataset.clubs;
    competitions = dataset.competitions;
    licences = dataset.licences;
  });

  afterEach(async () => {
    await getSeedHelper().cleanRaces();
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanLicences();
    await getSeedHelper().cleanUserClubs();
    await getSeedHelper().cleanClubs();
  });

  // ==================== CLUB ====================

  describe('Club', () => {
    it('POST /clubs : pose author = email JWT et lastChanged != null', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v2/clubs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          shortName: 'NEW',
          longName: 'Nouveau Club Audit',
          dept: '31',
        })
        .expect(201);

      const club = res.body as ClubEntity;
      expect(club.author).toBe(ADMIN_EMAIL);
      expect(club.lastChanged).toBeTruthy();
      expect(new Date(club.lastChanged).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('PATCH /clubs/:id : rafraîchit author et lastChanged', async () => {
      const target = clubs[0];

      const res = await request(getApp().getHttpServer())
        .patch(`/api/v2/clubs/${target.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ shortName: 'VCT2' })
        .expect(200);

      const updated = res.body as ClubEntity;
      expect(updated.shortName).toBe('VCT2');
      expect(updated.author).toBe(ADMIN_EMAIL);
      expect(updated.lastChanged).toBeTruthy();
    });

    it('POST /clubs : ignore author envoyé dans le body (pas de forge possible)', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v2/clubs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          shortName: 'FORGE',
          longName: 'Club avec tentative de forge',
          dept: '31',
          author: 'attacker@evil.com',
          lastChanged: new Date('2000-01-01').toISOString(),
        })
        .expect(201);

      const club = res.body as ClubEntity;
      expect(club.author).toBe(ADMIN_EMAIL);
      expect(club.author).not.toBe('attacker@evil.com');
      // Le lastChanged doit être récent (now), pas la date forgée
      expect(new Date(club.lastChanged).getFullYear()).toBeGreaterThanOrEqual(2025);
    });
  });

  // ==================== COMPETITION ====================

  describe('Competition', () => {
    it('POST /competitions : pose author = email JWT', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v2/competitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Compet Audit',
          eventDate: new Date('2026-12-15T09:00:00Z').toISOString(),
          zipCode: '31000',
          categories: '1,2,3',
          races: '1,2',
          fede: 'FSGT',
          competitionType: 'ROUTE',
          dept: '31',
          clubId: clubs[0].id,
        })
        .expect(201);

      const competition = res.body as CompetitionEntity;
      expect(competition.author).toBe(ADMIN_EMAIL);
      expect(competition.lastChanged).toBeTruthy();
    });

    it('PATCH /competitions/:id : rafraîchit author', async () => {
      const target = competitions[0];

      const res = await request(getApp().getHttpServer())
        .patch(`/api/v2/competitions/${target.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'GP Toulouse — édition modifiée' })
        .expect(200);

      const updated = res.body as CompetitionEntity;
      expect(updated.name).toBe('GP Toulouse — édition modifiée');
      expect(updated.author).toBe(ADMIN_EMAIL);
      expect(updated.lastChanged).toBeTruthy();
    });

    it('PATCH /competitions/:id : ignore author envoyé dans le body', async () => {
      const target = competitions[0];

      const res = await request(getApp().getHttpServer())
        .patch(`/api/v2/competitions/${target.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nom légitime',
          author: 'attacker@evil.com',
        })
        .expect(200);

      const updated = res.body as CompetitionEntity;
      expect(updated.author).toBe(ADMIN_EMAIL);
      expect(updated.author).not.toBe('attacker@evil.com');
    });
  });

  // ==================== RACE ====================

  describe('Race', () => {
    it('POST /races (engage) : pose author = email JWT', async () => {
      const licence = licences[2];
      const competition = competitions[2];

      const res = await request(getApp().getHttpServer())
        .post('/api/v2/races')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          licenceId: licence.id,
          competitionId: competition.id,
          raceCode: '1',
          riderNumber: 999,
          catev: '1',
        })
        .expect(201);

      const race = res.body as RaceEntity;
      expect(race.author).toBe(ADMIN_EMAIL);
      expect(race.lastChanged).toBeTruthy();
    });

    it('PATCH /races/:id (generic update) : rafraîchit author sans permettre de le forger', async () => {
      // engage d'abord pour avoir une race fraîche à mettre à jour
      const licence = licences[2];
      const competition = competitions[2];
      const engageRes = await request(getApp().getHttpServer())
        .post('/api/v2/races')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          licenceId: licence.id,
          competitionId: competition.id,
          raceCode: '2',
          riderNumber: 888,
          catev: '1',
        })
        .expect(201);
      const created = engageRes.body as RaceEntity;

      const res = await request(getApp().getHttpServer())
        .patch(`/api/v2/races/${created.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          riderNumber: 777,
          author: 'attacker@evil.com',
          lastChanged: new Date('2000-01-01').toISOString(),
        })
        .expect(200);

      const updated = res.body as RaceEntity;
      expect(updated.riderNumber).toBe(777);
      expect(updated.author).toBe(ADMIN_EMAIL);
      expect(updated.author).not.toBe('attacker@evil.com');
      expect(new Date(updated.lastChanged).getFullYear()).toBeGreaterThanOrEqual(2025);
    });
  });
});
