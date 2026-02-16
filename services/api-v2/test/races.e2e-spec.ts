import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { RaceEntity } from '../src/races/entities/race.entity';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { LicenceEntity } from '../src/licences/entities/licence.entity';
import { ClubEntity } from '../src/clubs/entities/club.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number; hasMore: boolean };
}

const API = '/api/v2/races';

describe('Races (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;
  let clubs: ClubEntity[];
  let licences: LicenceEntity[];
  let competitions: CompetitionEntity[];
  let races: RaceEntity[];

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  beforeEach(async () => {
    const dataset = await getSeedHelper().seedFullDataset();
    clubs = dataset.clubs;
    licences = dataset.licences;
    competitions = dataset.competitions;
    races = dataset.races;
  });

  afterEach(async () => {
    await getSeedHelper().cleanRaces();
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanLicences();
    await getSeedHelper().cleanClubs();
  });

  // ==================== GET /races ====================

  describe('GET /races (pagination & filters)', () => {
    it('should return paginated races', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<RaceEntity>;
      expect(body.data).toHaveLength(3);
      expect(body.meta.total).toBe(3);
    });

    it('should filter by competitionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ competitionId: competitions[0].id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<RaceEntity>;
      expect(body.data).toHaveLength(2);
      body.data.forEach(r => expect(r.competitionId).toBe(competitions[0].id));
    });

    it('should filter by raceCode', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ raceCode: '3' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<RaceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].raceCode).toBe('3');
    });

    it('should allow MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(200);
    });

    it('should reject unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(API).expect(401);
    });
  });

  // ==================== GET /races/:id ====================

  describe('GET /races/:id', () => {
    it('should return a single race', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/${races[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as RaceEntity;
      expect(body.id).toBe(races[0].id);
      expect(body.riderNumber).toBe(101);
    });

    it('should return 404 for non-existent race', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ==================== GET /races/competition/:competitionId ====================

  describe('GET /races/competition/:competitionId', () => {
    it('should return race entries with rider info', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/competition/${competitions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as any[];
      expect(body).toHaveLength(2);
      expect(body[0]).toHaveProperty('riderNumber');
    });

    it('should return empty array for competition with no races', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/competition/${competitions[2].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  // ==================== POST /races (engage) ====================

  describe('POST /races (engage)', () => {
    it('should engage a rider as ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          competitionId: competitions[2].id,
          licenceId: licences[0].id,
          raceCode: '1',
          riderNumber: 50,
          catev: '2',
          catea: 'S',
          club: 'Vélo Club Toulousain',
        })
        .expect(201);

      const body = res.body as RaceEntity;
      expect(body.id).toBeDefined();
      expect(body.riderNumber).toBe(50);
      expect(body.competitionId).toBe(competitions[2].id);
    });

    it('should reject duplicate rider number in same competition/raceCode (400)', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          competitionId: competitions[0].id,
          licenceId: licences[2].id,
          raceCode: '1/2',
          riderNumber: 101,
          catev: '1',
        })
        .expect(400);
    });

    it('should reject already registered licence in same competition/raceCode (400)', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          competitionId: competitions[0].id,
          licenceId: licences[0].id,
          raceCode: '1/2',
          riderNumber: 999,
          catev: '2',
        })
        .expect(400);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({
          competitionId: competitions[2].id,
          licenceId: licences[0].id,
          raceCode: '1',
          riderNumber: 50,
          catev: '2',
        })
        .expect(403);
    });
  });

  // ==================== PUT /races/ranking ====================

  describe('PUT /races/ranking', () => {
    it('should update ranking for a rider', async () => {
      const res = await request(getApp().getHttpServer())
        .put(`${API}/ranking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          riderNumber: races[0].riderNumber,
          raceCode: races[0].raceCode,
          competitionId: competitions[0].id,
          rankingScratch: 1,
        })
        .expect(200);

      const body = res.body as RaceEntity;
      expect(body.rankingScratch).toBe(1);
    });
  });

  // ==================== PUT /races/ranking/remove ====================

  describe('PUT /races/ranking/remove', () => {
    it('should remove ranking and reorder', async () => {
      // First, set ranking
      await request(getApp().getHttpServer())
        .put(`${API}/ranking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          riderNumber: races[0].riderNumber,
          raceCode: races[0].raceCode,
          competitionId: competitions[0].id,
          rankingScratch: 1,
        })
        .expect(200);

      const res = await request(getApp().getHttpServer())
        .put(`${API}/ranking/remove`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: races[0].id,
          raceCode: races[0].raceCode,
          competitionId: competitions[0].id,
        })
        .expect(200);

      expect((res.body as { success: boolean }).success).toBe(true);
    });
  });

  // ==================== PATCH /races/:id/chrono ====================

  describe('PATCH /races/:id/chrono', () => {
    it('should update chrono', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${races[0].id}/chrono`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ chrono: '01:23:45' })
        .expect(200);

      expect((res.body as RaceEntity).chrono).toBe('01:23:45');
    });
  });

  // ==================== PATCH /races/:id/tours ====================

  describe('PATCH /races/:id/tours', () => {
    it('should update tours', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${races[0].id}/tours`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tours: 5 })
        .expect(200);

      expect((res.body as RaceEntity).tours).toBe(5);
    });

    it('should set tours to null when not provided', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${races[0].id}/tours`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect((res.body as RaceEntity).tours).toBeNull();
    });
  });

  // ==================== DELETE /races/:id ====================

  describe('DELETE /races/:id', () => {
    it('should delete a race entry', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/${races[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(getApp().getHttpServer())
        .get(`${API}/${races[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent race', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/${races[0].id}`)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(403);
    });
  });

  // ==================== GET /races/palmares/:licenceId ====================

  describe('GET /races/palmares/:licenceId', () => {
    it('should return palmares for a rider', async () => {
      // Set a ranking first so palmares has data
      await request(getApp().getHttpServer())
        .put(`${API}/ranking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          riderNumber: races[0].riderNumber,
          raceCode: races[0].raceCode,
          competitionId: competitions[0].id,
          rankingScratch: 1,
        });

      const res = await request(getApp().getHttpServer())
        .get(`${API}/palmares/${licences[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as any;
      expect(body).toHaveProperty('licence');
      expect(body).toHaveProperty('stats');
      expect(body).toHaveProperty('results');
    });

    it('should return empty results for rider with no races', async () => {
      // Create a licence with no races
      const lics = await getSeedHelper().seedLicences();
      // licences[0] has races but we clean races first
      await getSeedHelper().cleanRaces();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/palmares/${lics[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as any;
      expect(body.results).toHaveLength(0);

      // Re-seed races for other tests
      races = await getSeedHelper().seedRaces(competitions, licences);
    });
  });
});
