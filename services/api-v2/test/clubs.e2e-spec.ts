import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { UserClubEntity } from '../src/auth/entities/user-club.entity';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { Federation } from '../src/common/enums';

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
    // user_club d'abord car FK cascade sur club_id : éviter qu'un truncate
    // CASCADE sur "club" ne laisse pas de surprise si l'ordre s'inverse.
    await getSeedHelper().cleanUserClubs();
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

  describe('GET /clubs/me/accessible', () => {
    it('returns scope=ALL for ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/me/accessible`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ scope: 'ALL' });
    });

    it('returns scope=SCOPED + empty list for unlinked ORGA', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/me/accessible`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(200);

      expect(res.body).toEqual({ scope: 'SCOPED', clubIds: [] });
    });

    it('returns scope=SCOPED + clubIds for linked ORGA', async () => {
      const [vct, ccg] = await getSeedHelper().seedClubs();
      await getSeedHelper().seedUserClubs([
        { userId: 2, clubId: vct.id },
        { userId: 2, clubId: ccg.id },
      ]);

      const res = await request(getApp().getHttpServer())
        .get(`${API}/me/accessible`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(200);

      const body = res.body as { scope: string; clubIds: number[] };
      expect(body.scope).toBe('SCOPED');
      expect(new Set(body.clubIds)).toEqual(new Set([vct.id, ccg.id]));
    });

    it('rejects unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(`${API}/me/accessible`).expect(401);
    });
  });

  describe('POST /clubs', () => {
    it('should create a club as ADMIN (no auto-link)', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ shortName: 'TEST', longName: 'Club de Test', dept: '75', fede: 'FSGT' })
        .expect(201);

      const body = res.body as ClubEntity;
      expect(body.id).toBeDefined();
      expect(body.longName).toBe('Club de Test');

      const dataSource = getApp().get(DataSource);
      const link = await dataSource
        .getRepository(UserClubEntity)
        .findOne({ where: { userId: 1, clubId: body.id } });
      expect(link).toBeNull();
    });

    it('should create a club as ORGANISATEUR AND auto-link the creator', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({ shortName: 'ORG', longName: 'Club Orga' })
        .expect(201);

      const created = res.body as ClubEntity;
      const dataSource = getApp().get(DataSource);
      const link = await dataSource
        .getRepository(UserClubEntity)
        .findOne({ where: { userId: 2, clubId: created.id } });
      expect(link).not.toBeNull();
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

  describe('PATCH /clubs/:id (scope par club)', () => {
    it('ADMIN can update any club (bypass scope)', async () => {
      const [club] = await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ longName: 'Vélo Club Toulouse Métropole' })
        .expect(200);

      expect((res.body as ClubEntity).longName).toBe('Vélo Club Toulouse Métropole');
    });

    it('ORGA linked to the club can update', async () => {
      const [club] = await getSeedHelper().seedClubs();
      await getSeedHelper().seedUserClubs([{ userId: 2, clubId: club.id }]);

      await request(getApp().getHttpServer())
        .patch(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({ shortName: 'VCT2' })
        .expect(200);
    });

    it('ORGA NOT linked to the club gets 403', async () => {
      const [club] = await getSeedHelper().seedClubs();

      await request(getApp().getHttpServer())
        .patch(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({ shortName: 'BAD' })
        .expect(403);
    });
  });

  describe('DELETE /clubs/:id (scope par club)', () => {
    it('ADMIN can delete an unreferenced club', async () => {
      const [club] = await getSeedHelper().seedClubs();

      await request(getApp().getHttpServer())
        .delete(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(getApp().getHttpServer())
        .get(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('ORGA linked to the club can delete', async () => {
      const [club] = await getSeedHelper().seedClubs();
      await getSeedHelper().seedUserClubs([{ userId: 2, clubId: club.id }]);

      await request(getApp().getHttpServer())
        .delete(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(200);
    });

    it('ORGA NOT linked to the club gets 403', async () => {
      const [club] = await getSeedHelper().seedClubs();

      await request(getApp().getHttpServer())
        .delete(`${API}/${club.id}`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent club (as ADMIN, scope bypass)', async () => {
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

  describe('GET /clubs/legacy', () => {
    // seedClubs() crée : 2 clubs FSGT (dept 31, 32) + 1 club FFC (dept 33).
    it('returns all clubs when no filter', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/legacy`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ClubEntity[];
      expect(body).toHaveLength(3);
    });

    it('filters by a single federation', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/legacy`)
        .query({ fede: 'FSGT' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ClubEntity[];
      expect(body).toHaveLength(2);
      expect(body.every(c => c.fede === Federation.FSGT)).toBe(true);
    });

    it('filters by several federations (repeated fede param)', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/legacy`)
        .query({ fede: ['FSGT', 'FFC'] })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ClubEntity[];
      expect(body).toHaveLength(3);
      expect(body.map(c => c.fede).sort()).toEqual(['FFC', 'FSGT', 'FSGT']);
    });

    it('returns nothing for a federation without clubs', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/legacy`)
        .query({ fede: 'UFOLEP' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ClubEntity[];
      expect(body).toHaveLength(0);
    });

    it('combines federation and department filters', async () => {
      await getSeedHelper().seedClubs();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/legacy`)
        .query({ fede: ['FSGT', 'FFC'], dept: '31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ClubEntity[];
      expect(body).toHaveLength(1);
      expect(body[0].dept).toBe('31');
    });

    it('rejects unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(`${API}/legacy`).expect(401);
    });
  });
});
