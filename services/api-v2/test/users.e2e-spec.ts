import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { UserEntity } from '../src/users/entities/user.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number; hasMore: boolean };
}

const API = '/api/v2/users';

describe('Users (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanUsers();
  });

  // ==================== GET /users ====================

  describe('GET /users (admin only)', () => {
    it('should return paginated users', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<UserEntity>;
      // 3 seed users
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.meta).toHaveProperty('total');
      expect(body.meta).toHaveProperty('offset');
      expect(body.meta).toHaveProperty('limit');
    });

    it('should filter by search term', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ search: 'admin' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<UserEntity>;
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.some(u => u.email === 'admin@test.com')).toBe(true);
    });

    it('should reject ORGANISATEUR role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(403);
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

  // ==================== GET /users/:id ====================

  describe('GET /users/:id', () => {
    it('should return a user by ID', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/1`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as UserEntity;
      expect(body.email).toBe('admin@test.com');
      expect(body.firstName).toBe('Admin');
    });

    it('should return 404 for non-existent user', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ==================== POST /users ====================

  describe('POST /users', () => {
    it('should create a user as ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          roles: ['ORGANISATEUR'],
        })
        .expect(201);

      const body = res.body as UserEntity;
      expect(body.id).toBeDefined();
      expect(body.email).toBe('newuser@test.com');
    });

    it('should reject duplicate email (409)', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@test.com',
          password: 'password123',
        })
        .expect(409);
    });

    it('should reject ORGANISATEUR role', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({
          email: 'x@test.com',
          password: 'password123',
        })
        .expect(403);
    });
  });

  // ==================== PATCH /users/:id ====================

  describe('PATCH /users/:id', () => {
    it('should update user fields', async () => {
      // Create a test user first
      const createRes = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'toupdate@test.com',
          password: 'password123',
          firstName: 'Before',
          lastName: 'Update',
        })
        .expect(201);

      const userId = (createRes.body as UserEntity).id;

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'After', roles: ['ADMIN', 'ORGANISATEUR'] })
        .expect(200);

      const body = res.body as UserEntity;
      expect(body.firstName).toBe('After');
      expect(body.roles).toBe('ADMIN,ORGANISATEUR');
    });
  });

  // ==================== POST /users/:id/reset-password ====================

  describe('POST /users/:id/reset-password', () => {
    it('should reset password as ADMIN', async () => {
      // Create a test user
      const createRes = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'resetme@test.com',
          password: 'oldpassword',
          firstName: 'Reset',
          lastName: 'Me',
        })
        .expect(201);

      const userId = (createRes.body as UserEntity).id;

      const res = await request(getApp().getHttpServer())
        .post(`${API}/${userId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'newpassword123' })
        .expect(201);

      expect((res.body as { success: boolean }).success).toBe(true);
    });
  });

  // ==================== DELETE /users/:id ====================

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const createRes = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'deleteme@test.com',
          password: 'password123',
          firstName: 'Delete',
          lastName: 'Me',
        })
        .expect(201);

      const userId = (createRes.body as UserEntity).id;

      await request(getApp().getHttpServer())
        .delete(`${API}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(getApp().getHttpServer())
        .get(`${API}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
