import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { ClubEntity } from '../src/clubs/entities/club.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number };
}

const API = '/api/v2/clubs';

describe('Clubs (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanClubs();
  });

  describe('GET /clubs (pagination)', () => {
    it('should return paginated clubs', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<ClubEntity>;
      expect(body.data).toHaveLength(3);
      expect(body.meta.total).toBe(3);
      expect(body.meta).toHaveProperty('offset');
      expect(body.meta).toHaveProperty('limit');
    });

    it('should filter by search term', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ search: 'Toulousain' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<ClubEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].longName).toBe('Vélo Club Toulousain');
    });

    it('should filter by column (dept)', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ dept: '31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<ClubEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].dept).toBe('31');
    });

    it('should sort by longName DESC', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ orderBy: 'longName', orderDirection: 'DESC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<ClubEntity>;
      const names = body.data.map(c => c.longName);
      expect(names[0]).toBe('Vélo Club Toulousain');
    });

    it('should reject unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(API).expect(401);
    });
  });

  describe('POST /clubs', () => {
    it('should create a club as ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ shortName: 'TEST', longName: 'Club de Test', dept: '75', fede: 'FSGT' })
        .expect(201);

      const body = res.body as ClubEntity;
      expect(body.id).toBeDefined();
      expect(body.longName).toBe('Club de Test');
    });

    it('should create a club as ORGANISATEUR', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({ shortName: 'ORG', longName: 'Club Orga' })
        .expect(201);
    });

    it('should reject MOBILE role', async () => {
      const mobileToken = getAuthHelper().getMobileToken();
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({ shortName: 'X', longName: 'X' })
        .expect(403);
    });
  });

  describe('GET /clubs/:id', () => {
    it('should return a single club', async () => {
      const [club] = await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect((res.body as ClubEntity).longName).toBe('Vélo Club Toulousain');
    });

    it('should return 404 for non-existent club', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /clubs/:id', () => {
    it('should update a club', async () => {
      const [club] = await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ longName: 'Vélo Club Toulouse Métropole' })
        .expect(200);

      expect((res.body as ClubEntity).longName).toBe('Vélo Club Toulouse Métropole');
    });
  });

  describe('DELETE /clubs/:id', () => {
    it('should delete an unreferenced club', async () => {
      const [club] = await getSeedHelper().seedClubs();

      await request(getApp().getHttpServer())
        .delete(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's gone
      await request(getApp().getHttpServer())
        .get(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent club', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /clubs/:id/references', () => {
    it('should return zero counts for unreferenced club', async () => {
      const [club] = await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/${club.id}/references`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        raceCount: number;
        licenceCount: number;
        competitionCount: number;
      };
      expect(body.raceCount).toBe(0);
      expect(body.licenceCount).toBe(0);
      expect(body.competitionCount).toBe(0);
    });
  });
});
