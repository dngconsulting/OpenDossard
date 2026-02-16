import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';

const API = '/api/v2/dashboard';

describe('Dashboard (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  // ==================== GET /dashboard ====================

  describe('GET /dashboard (summary)', () => {
    it('should return dashboard summary with counters', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { stats: { totalLicenses: number; totalCompetitions: number } };
      expect(body).toHaveProperty('stats');
      expect(body.stats).toHaveProperty('totalLicenses');
      expect(body.stats).toHaveProperty('totalCompetitions');
      expect(typeof body.stats.totalLicenses).toBe('number');
      expect(typeof body.stats.totalCompetitions).toBe('number');
    });

    it('should return zeros on empty database', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { stats: { totalLicenses: number; totalCompetitions: number } };
      expect(body.stats.totalLicenses).toBe(0);
      expect(body.stats.totalCompetitions).toBe(0);
    });

    it('should allow ORGANISATEUR role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(200);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(API).expect(401);
    });
  });

  // ==================== GET /dashboard/stats ====================

  describe('GET /dashboard/stats', () => {
    it('should return detailed stats', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as any;
      expect(body).toHaveProperty('totalCompetitions');
      expect(body).toHaveProperty('totalLicences');
      expect(body).toHaveProperty('totalRaces');
      expect(body).toHaveProperty('totalClubs');
      expect(body).toHaveProperty('competitionsByFederation');
      expect(body).toHaveProperty('competitionsByType');
    });

    it('should allow ORGANISATEUR role', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/stats`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(200);
    });
  });

  // ==================== GET /dashboard/recent ====================

  describe('GET /dashboard/recent', () => {
    it('should return recent activity', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/recent`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        recentCompetitions: any[];
        recentRaces: any[];
      };
      expect(body).toHaveProperty('recentCompetitions');
      expect(body).toHaveProperty('recentRaces');
      expect(Array.isArray(body.recentCompetitions)).toBe(true);
      expect(Array.isArray(body.recentRaces)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/recent`)
        .query({ limit: 1 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { recentCompetitions: any[]; recentRaces: any[] };
      expect(body.recentCompetitions.length).toBeLessThanOrEqual(1);
      expect(body.recentRaces.length).toBeLessThanOrEqual(1);
    });
  });

  // ==================== GET /dashboard/charts/* ====================

  describe('GET /dashboard/charts', () => {
    it('should return riders-per-competition chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/riders-per-competition`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as any[];
      expect(Array.isArray(body)).toBe(true);
    });

    it('should return club-participation chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/club-participation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return catea-distribution chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/catea-distribution`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return catev-distribution chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/catev-distribution`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return top-riders chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/top-riders`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return chart data with correct structure when data exists', async () => {
      await getSeedHelper().seedFullDataset();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/riders-per-competition`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { name: string; eventDate: string; count: number }[];
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).toHaveProperty('eventDate');
      expect(body[0]).toHaveProperty('count');

      // Cleanup
      await getSeedHelper().cleanRaces();
      await getSeedHelper().cleanCompetitions();
      await getSeedHelper().cleanLicences();
      await getSeedHelper().cleanClubs();
    });
  });
});
