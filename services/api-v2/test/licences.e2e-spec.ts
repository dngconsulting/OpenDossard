import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { LicenceEntity } from '../src/licences/entities/licence.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number; hasMore: boolean };
}

const API = '/api/v2/licences';

describe('Licences (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanLicences();
  });

  describe('GET /licences (pagination & filters)', () => {
    it('should return paginated licences', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(3);
      expect(body.meta.total).toBe(3);
      expect(body.meta).toHaveProperty('offset');
      expect(body.meta).toHaveProperty('limit');
    });

    it('should respect offset and limit', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ offset: 0, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(3);
      expect(body.meta.hasMore).toBe(true);
    });

    it('should filter by name column', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ name: 'DUPONT' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('DUPONT');
    });

    it('should filter by dept', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ dept: '31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].dept).toBe('31');
    });

    it('should filter by fede', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ fede: 'FFC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].fede).toBe('FFC');
    });

    it('should filter by global search', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ search: 'DUPONT' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('DUPONT');
    });

    it('should sort by name DESC', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ orderBy: 'name', orderDirection: 'DESC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      const names = body.data.map(l => l.name);
      expect(names).toEqual(['MARTIN', 'GARCÍA', 'DUPONT']);
    });

    it('should reject unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(API).expect(401);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(403);
    });
  });

  describe('GET /licences/search', () => {
    it('should return matching licences by name prefix', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/search`)
        .query({ q: 'DUP' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as LicenceEntity[];
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe('DUPONT');
    });

    it('should return matching licences by licence number', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/search`)
        .query({ q: '12345' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as LicenceEntity[];
      expect(body).toHaveLength(1);
      expect(body[0].licenceNumber).toBe('12345678');
    });

    it('should allow MOBILE role', async () => {
      await getSeedHelper().seedLicences();

      await request(getApp().getHttpServer())
        .get(`${API}/search`)
        .query({ q: 'DUPONT' })
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(200);
    });
  });

  describe('GET /licences/:id', () => {
    it('should return a single licence', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.name).toBe('DUPONT');
      expect(body.firstName).toBe('Jean');
    });

    it('should return 404 for non-existent licence', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should allow MOBILE role', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      await request(getApp().getHttpServer())
        .get(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(200);
    });
  });

  describe('POST /licences', () => {
    it('should create a licence as ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'LEROY',
          firstName: 'Lucas',
          gender: 'H',
          birthYear: '2000',
          dept: '75',
          fede: 'FSGT',
          catea: 'E',
          saison: '2025',
        })
        .expect(201);

      const body = res.body as LicenceEntity;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('LEROY');
      expect(body.author).toBe('admin@test.com');
    });

    it('should create a licence as ORGANISATEUR', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({
          name: 'PETIT',
          firstName: 'Julie',
          gender: 'F',
          birthYear: '1995',
          dept: '31',
          fede: 'FSGT',
          catea: 'FS',
          saison: '2025',
        })
        .expect(201);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({
          name: 'X',
          firstName: 'X',
          gender: 'H',
          birthYear: '2000',
          dept: '75',
          fede: 'FSGT',
          catea: 'S',
          saison: '2025',
        })
        .expect(403);
    });

    it('should reject invalid payload (missing required fields)', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ONLY_NAME' })
        .expect(400);
    });
  });

  describe('PATCH /licences/:id', () => {
    it('should update a licence', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catev: '1' })
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.catev).toBe('1');
      expect(body.author).toBe('admin@test.com');
    });

    it('should return 404 for non-existent licence', async () => {
      await request(getApp().getHttpServer())
        .patch(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catev: '1' })
        .expect(404);
    });
  });

  describe('DELETE /licences/:id', () => {
    it('should delete a licence', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .delete(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect((res.body as { success: boolean }).success).toBe(true);

      await request(getApp().getHttpServer())
        .get(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent licence', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
