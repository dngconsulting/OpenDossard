import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { UserEntity } from '../src/users/entities/user.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number; hasMore: boolean };
}

const API = '/api/v2/users';

describe('Users (e2e)', () => {
  let superAdminToken: string;
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    superAdminToken = getAuthHelper().getSuperAdminToken();
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanUsers();
  });

  // ==================== GET /users ====================

  describe('GET /users (super admin only)', () => {
    it('should return paginated users', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
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
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<UserEntity>;
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.some(u => u.email === 'admin@test.com')).toBe(true);
    });

    it('should filter firebase users with source=dossardeur', async () => {
      const firebaseUser = await getSeedHelper().seedFirebaseUser();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ source: 'dossardeur' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<UserEntity>;
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.every(u => Boolean(u.firebaseUid))).toBe(true);
      expect(body.data.some(u => u.id === firebaseUser.id)).toBe(true);
    });

    it('should filter backoffice users with source=opendossard', async () => {
      const firebaseUser = await getSeedHelper().seedFirebaseUser();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ source: 'opendossard' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<UserEntity>;
      // Les 3 seed users sont des users backoffice
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.data.every(u => !u.firebaseUid)).toBe(true);
      expect(body.data.some(u => u.id === firebaseUser.id)).toBe(false);
    });

    it('should match firebaseUid in search', async () => {
      const firebaseUser = await getSeedHelper().seedFirebaseUser('searchable-uid-42');

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ search: 'searchable-uid' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<UserEntity>;
      expect(body.data.some(u => u.id === firebaseUser.id)).toBe(true);
    });

    it('should sort by firebaseUid', async () => {
      await getSeedHelper().seedFirebaseUser('uid-bbb');
      await getSeedHelper().seedFirebaseUser('uid-aaa');

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ source: 'dossardeur', orderBy: 'firebaseUid', orderDirection: 'ASC' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<UserEntity>;
      const uids = body.data.map(u => u.firebaseUid);
      expect(uids).toEqual(['uid-aaa', 'uid-bbb']);
    });

    it('should reject an invalid source value', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .query({ source: 'invalid' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
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

    it('should match organisation in search and sort by it, NULL last', async () => {
      for (const body of [
        { email: 'orga-b@test.com', organisation: 'Zeta Vélo-Club' },
        { email: 'orga-a@test.com', organisation: 'Alpha Vélo-Club' },
        { email: 'orga-none@test.com', lastName: 'Vélo-Club Sans Orga' },
      ]) {
        await request(getApp().getHttpServer())
          .post(API)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ ...body, password: 'password123' })
          .expect(201);
      }

      const sorted = async (orderDirection: 'ASC' | 'DESC') => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'vélo-club', orderBy: 'organisation', orderDirection })
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);
        return (res.body as PaginatedResponse<UserEntity>).data.map(u => u.organisation);
      };

      expect(await sorted('ASC')).toEqual(['Alpha Vélo-Club', 'Zeta Vélo-Club', null]);
      expect(await sorted('DESC')).toEqual(['Zeta Vélo-Club', 'Alpha Vélo-Club', null]);
    });
  });

  // ==================== GET /users/:id ====================

  describe('GET /users/:id', () => {
    it('should return a user by ID', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/1`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as UserEntity;
      expect(body.email).toBe('admin@test.com');
      expect(body.firstName).toBe('Admin');
    });

    it('should return 404 for non-existent user', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });

  // ==================== POST /users ====================

  describe('POST /users', () => {
    it('should persist organisation', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'orga-create@test.com',
          password: 'password123',
          phone: '0612345678',
          organisation: 'TOAC Cyclisme',
        })
        .expect(201);

      const body = res.body as UserEntity;
      expect(body.phone).toBe('0612345678');
      expect(body.organisation).toBe('TOAC Cyclisme');
    });

    it('should create a user as SUPER_ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
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
        .set('Authorization', `Bearer ${superAdminToken}`)
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
        .set('Authorization', `Bearer ${superAdminToken}`)
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
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ firstName: 'After', roles: ['ADMIN', 'ORGANISATEUR'] })
        .expect(200);

      const body = res.body as UserEntity;
      expect(body.firstName).toBe('After');
      expect(body.roles).toBe('ADMIN,ORGANISATEUR');
    });

    it('should update and clear organisation', async () => {
      const createRes = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email: 'orga-update@test.com', password: 'password123', organisation: 'Avant' })
        .expect(201);
      const userId = (createRes.body as UserEntity).id;

      const updated = await request(getApp().getHttpServer())
        .patch(`${API}/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ organisation: 'Balma Olympique Cyclisme' })
        .expect(200);
      expect((updated.body as UserEntity).organisation).toBe('Balma Olympique Cyclisme');

      const nulled = await request(getApp().getHttpServer())
        .patch(`${API}/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ organisation: null })
        .expect(200);
      expect((nulled.body as UserEntity).organisation).toBeNull();
    });

    it('should clear phone when null is sent', async () => {
      const createRes = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email: 'phone-clear@test.com', password: 'password123', phone: '0612345678' })
        .expect(201);
      const userId = (createRes.body as UserEntity).id;

      const cleared = await request(getApp().getHttpServer())
        .patch(`${API}/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ phone: null })
        .expect(200);
      expect((cleared.body as UserEntity).phone).toBeNull();
    });
  });

  // ==================== POST /users/:id/reset-password ====================

  describe('POST /users/:id/reset-password', () => {
    it('should reset password as SUPER_ADMIN', async () => {
      // Create a test user
      const createRes = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
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
        .set('Authorization', `Bearer ${superAdminToken}`)
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
        .set('Authorization', `Bearer ${superAdminToken}`)
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
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      await request(getApp().getHttpServer())
        .get(`${API}/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/99999`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });

  // ==================== SUPER_ADMIN implique ADMIN ====================

  describe('SUPER_ADMIN implique ADMIN', () => {
    it('ajoute ADMIN à la création et à la mise à jour quand seul SUPER_ADMIN est envoyé', async () => {
      const created = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email: 'super@test.com', password: 'password123', roles: ['SUPER_ADMIN'] })
        .expect(201);
      const body = created.body as UserEntity;
      expect(body.roles).toBe('SUPER_ADMIN,ADMIN');

      const other = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email: 'promu@test.com', password: 'password123', roles: ['ORGANISATEUR'] })
        .expect(201);

      const updated = await request(getApp().getHttpServer())
        .patch(`${API}/${(other.body as UserEntity).id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ roles: ['ORGANISATEUR', 'SUPER_ADMIN'] })
        .expect(200);
      expect((updated.body as UserEntity).roles).toBe('ORGANISATEUR,SUPER_ADMIN,ADMIN');
    });
  });

  // ==================== ADMIN simple : gestion des utilisateurs interdite ====================

  describe('ADMIN sans SUPER_ADMIN', () => {
    const asAdmin = (method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string) =>
      request(getApp().getHttpServer())[method](path).set('Authorization', `Bearer ${adminToken}`);

    it.each([
      ['get', API],
      ['get', `${API}/2`],
      ['post', API],
      ['patch', `${API}/2`],
      ['post', `${API}/2/reset-password`],
      ['delete', `${API}/2`],
      ['put', `${API}/2/clubs`],
    ] as const)('%s %s → 403', async (method, path) => {
      await asAdmin(method, path).send({}).expect(403);
    });

    it("ne peut pas s'auto-promouvoir SUPER_ADMIN", async () => {
      await asAdmin('patch', `${API}/1`)
        .send({ roles: ['ADMIN', 'SUPER_ADMIN'] })
        .expect(403);

      const me = await getApp()
        .get(DataSource)
        .getRepository(UserEntity)
        .findOneByOrFail({ id: 1 });
      expect(me.roles).toBe('ADMIN');
    });

    it("ne peut pas consulter les clubs d'un autre user, mais peut consulter les siens", async () => {
      await asAdmin('get', `${API}/2/clubs`).expect(403);
      await asAdmin('get', `${API}/1/clubs`).expect(200);
    });
  });
});
