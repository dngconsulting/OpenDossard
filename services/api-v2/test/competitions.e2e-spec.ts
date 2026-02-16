import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number; hasMore: boolean };
}

type CompetitionRow = CompetitionEntity & {
  engagementsCount: number;
  classementsCount: number;
};

const API = '/api/v2/competitions';

describe('Competitions (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanClubs();
  });

  // ==================== GET /competitions ====================

  describe('GET /competitions (pagination & filters)', () => {
    it('should return paginated competitions', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      expect(body.data).toHaveLength(3);
      expect(body.meta.total).toBe(3);
      expect(body.meta).toHaveProperty('offset');
      expect(body.meta).toHaveProperty('limit');
    });

    it('should include engagementsCount and classementsCount', async () => {
      const { competitions, licences } = await getSeedHelper().seedFullDataset();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      const comp = body.data.find(c => c.id === competitions[0].id);
      expect(comp).toBeDefined();
      expect(comp!.engagementsCount).toBe(2);
      expect(comp!.classementsCount).toBe(0);

      // Clean extra data
      await getSeedHelper().cleanRaces();
      await getSeedHelper().cleanLicences();
    });

    it('should filter by name', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ name: 'Toulouse' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Grand Prix de Toulouse');
    });

    it('should filter by fede', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ fede: 'FFC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].fede).toBe('FFC');
    });

    it('should filter by competitionType', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ competitionType: 'CX' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].competitionType).toBe('CX');
    });

    it('should filter by dept', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ dept: '31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].dept).toBe('31');
    });

    it('should filter by date range', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ startDate: '2025-10-01', endDate: '2025-12-31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Cyclo-cross de Auch');
    });

    it('should filter by multiple fedes', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ fedes: 'FSGT,FFC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      expect(body.data).toHaveLength(3);
    });

    it('should sort by name DESC', async () => {
      await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ orderBy: 'name', orderDirection: 'DESC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<CompetitionRow>;
      const names = body.data.map(c => c.name);
      expect(names[0]).toBe('Gravel des Pyrénées');
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

  // ==================== GET /competitions/:id ====================

  describe('GET /competitions/:id', () => {
    it('should return a single competition', async () => {
      const [comp] = await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/${comp.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect((res.body as CompetitionEntity).name).toBe('Grand Prix de Toulouse');
    });

    it('should return 404 for non-existent competition', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ==================== POST /competitions ====================

  describe('POST /competitions', () => {
    it('should create a competition as ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Course de Test',
          eventDate: '2025-07-01T09:00:00Z',
          zipCode: '75000',
          categories: '1,2,3',
          races: '1/2,3',
          fede: 'FSGT',
          competitionType: 'ROUTE',
        })
        .expect(201);

      const body = res.body as CompetitionEntity;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Course de Test');
    });

    it('should create a competition as ORGANISATEUR', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({
          name: 'Course Orga',
          eventDate: '2025-07-01T09:00:00Z',
          zipCode: '31000',
          categories: '1,2',
          races: '1,2',
        })
        .expect(201);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({
          name: 'X',
          eventDate: '2025-07-01T09:00:00Z',
          zipCode: '31000',
          categories: '1',
          races: '1',
        })
        .expect(403);
    });
  });

  // ==================== PATCH /competitions/:id ====================

  describe('PATCH /competitions/:id', () => {
    it('should update a competition', async () => {
      const [comp] = await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${comp.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grand Prix Modifié' })
        .expect(200);

      expect((res.body as CompetitionEntity).name).toBe('Grand Prix Modifié');
    });

    it('should return 404 for non-existent competition', async () => {
      await request(getApp().getHttpServer())
        .patch(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })
        .expect(404);
    });
  });

  // ==================== DELETE /competitions/:id ====================

  describe('DELETE /competitions/:id', () => {
    it('should delete a competition', async () => {
      const [comp] = await getSeedHelper().seedCompetitions();

      await request(getApp().getHttpServer())
        .delete(`${API}/${comp.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(getApp().getHttpServer())
        .get(`${API}/${comp.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent competition', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject MOBILE role', async () => {
      const [comp] = await getSeedHelper().seedCompetitions();

      await request(getApp().getHttpServer())
        .delete(`${API}/${comp.id}`)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(403);
    });
  });

  // ==================== POST /competitions/:id/duplicate ====================

  describe('POST /competitions/:id/duplicate', () => {
    it('should duplicate with "(copie)" suffix and resultsValidated=false', async () => {
      const [comp] = await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .post(`${API}/${comp.id}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const body = res.body as CompetitionEntity;
      expect(body.id).not.toBe(comp.id);
      expect(body.name).toBe('Grand Prix de Toulouse (copie)');
      expect(body.resultsValidated).toBeFalsy();
    });
  });

  // ==================== POST /competitions/:id/validate ====================

  describe('POST /competitions/:id/validate', () => {
    it('should set resultsValidated to true', async () => {
      const [comp] = await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .post(`${API}/${comp.id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect((res.body as CompetitionEntity).resultsValidated).toBe(true);
    });
  });
});
