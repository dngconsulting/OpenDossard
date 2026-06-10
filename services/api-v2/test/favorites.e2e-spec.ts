import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { Role } from '../src/common/enums';
import { FavoriteCompetitionDto } from '../src/notifications/dto/favorite-competition.dto';
import { UserEntity } from '../src/users/entities/user.entity';

const API = '/api/v2/favorites';

/**
 * Endpoints favoris (épreuves starrées) — rôle MOBILE strict.
 *
 *   GET    /api/v2/favorites                  → number[] des competitionId starrés (source de vérité)
 *   POST   /api/v2/favorites                  { competitionId } → 204, idempotent, 404 si compet inconnue
 *   DELETE /api/v2/favorites/:competitionId   → 204, idempotent
 *
 * L'identité vient TOUJOURS du JWT (@CurrentUser), jamais du body : un user
 * ne star/unstar que pour lui-même.
 */
describe('Favorites (e2e)', () => {
  let mobileToken: string;
  let adminToken: string;
  let orgaToken: string;
  /** Second user avec rôle MOBILE (user id 1, rôle porté par le JWT) pour tester l'isolation. */
  let otherMobileToken: string;

  beforeAll(() => {
    mobileToken = getAuthHelper().getMobileToken();
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    otherMobileToken = getAuthHelper().generateToken(1, 'admin@test.com', [Role.MOBILE]);
  });

  afterEach(async () => {
    // TRUNCATE CASCADE sur competition purge aussi user_favorites (FK).
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanClubs();
  });

  const star = (competitionId: number, token: string) =>
    request(getApp().getHttpServer())
      .post(API)
      .set('Authorization', `Bearer ${token}`)
      .send({ competitionId });

  const unstar = (competitionId: number, token: string) =>
    request(getApp().getHttpServer())
      .delete(`${API}/${competitionId}`)
      .set('Authorization', `Bearer ${token}`);

  const getFavorites = (token: string) =>
    request(getApp().getHttpServer()).get(API).set('Authorization', `Bearer ${token}`);

  // ==================== POST /favorites ====================

  describe('POST /favorites', () => {
    it('should star a competition and expose it via GET', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();

      await star(competition.id, mobileToken).expect(204);

      const res = await getFavorites(mobileToken).expect(200);
      expect(res.body).toEqual([competition.id]);
    });

    it('should be idempotent when starring the same competition twice', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();

      await star(competition.id, mobileToken).expect(204);
      await star(competition.id, mobileToken).expect(204);

      const res = await getFavorites(mobileToken).expect(200);
      expect(res.body).toEqual([competition.id]);
    });

    it('should return 404 for an unknown competition', async () => {
      await star(999999, mobileToken).expect(404);
    });

    it('should return 400 when competitionId is missing or invalid', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({})
        .expect(400);

      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({ competitionId: 'abc' })
        .expect(400);
    });

    it('should reject ADMIN role (403)', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();
      await star(competition.id, adminToken).expect(403);
    });

    it('should reject ORGANISATEUR role (403)', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();
      await star(competition.id, orgaToken).expect(403);
    });

    it('should reject unauthenticated request (401)', async () => {
      await request(getApp().getHttpServer()).post(API).send({ competitionId: 1 }).expect(401);
    });
  });

  // ==================== GET /favorites ====================

  describe('GET /favorites', () => {
    it('should return an empty list when nothing is starred', async () => {
      const res = await getFavorites(mobileToken).expect(200);
      expect(res.body).toEqual([]);
    });

    it('should return only the favorites of the current user', async () => {
      const competitions = await getSeedHelper().seedCompetitions();

      await star(competitions[0].id, mobileToken).expect(204);
      await star(competitions[1].id, mobileToken).expect(204);
      await star(competitions[2].id, otherMobileToken).expect(204);

      const res = await getFavorites(mobileToken).expect(200);
      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual(expect.arrayContaining([competitions[0].id, competitions[1].id]));
    });

    it('should reject ADMIN role (403)', async () => {
      await getFavorites(adminToken).expect(403);
    });

    it('should reject unauthenticated request (401)', async () => {
      await request(getApp().getHttpServer()).get(API).expect(401);
    });
  });

  // ==================== GET /favorites/competitions ====================

  describe('GET /favorites/competitions', () => {
    const getFavoriteCompetitions = (token: string) =>
      request(getApp().getHttpServer())
        .get(`${API}/competitions`)
        .set('Authorization', `Bearer ${token}`);

    it('should return starred competitions with fede, eventDate and name, most recent first', async () => {
      // Seed : GP Toulouse 2025-06-15 (FSGT), CX Auch 2025-11-20 (FSGT), Gravel 2025-09-01 (FFC)
      const competitions = await getSeedHelper().seedCompetitions();
      for (const competition of competitions) {
        await star(competition.id, mobileToken).expect(204);
      }

      const res = await getFavoriteCompetitions(mobileToken).expect(200);

      expect(res.body).toEqual([
        {
          competitionId: competitions[1].id,
          name: 'Cyclo-cross de Auch',
          eventDate: '2025-11-20T10:00:00.000Z',
          fede: 'FSGT',
        },
        {
          competitionId: competitions[2].id,
          name: 'Gravel des Pyrénées',
          eventDate: '2025-09-01T08:00:00.000Z',
          fede: 'FFC',
        },
        {
          competitionId: competitions[0].id,
          name: 'Grand Prix de Toulouse',
          eventDate: '2025-06-15T09:00:00.000Z',
          fede: 'FSGT',
        },
      ]);
    });

    it('should return an empty list when nothing is starred', async () => {
      const res = await getFavoriteCompetitions(mobileToken).expect(200);
      expect(res.body).toEqual([]);
    });

    it('should return only the favorites of the current user', async () => {
      const competitions = await getSeedHelper().seedCompetitions();
      await star(competitions[0].id, mobileToken).expect(204);
      await star(competitions[1].id, otherMobileToken).expect(204);

      const res = await getFavoriteCompetitions(mobileToken).expect(200);
      const body = res.body as FavoriteCompetitionDto[];
      expect(body).toHaveLength(1);
      expect(body[0].competitionId).toBe(competitions[0].id);
    });

    it('should reject ADMIN role (403)', async () => {
      await getFavoriteCompetitions(adminToken).expect(403);
    });

    it('should reject unauthenticated request (401)', async () => {
      await request(getApp().getHttpServer()).get(`${API}/competitions`).expect(401);
    });
  });

  // ==================== DELETE /favorites/:competitionId ====================

  describe('DELETE /favorites/:competitionId', () => {
    it('should unstar a competition and remove it from GET', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();
      await star(competition.id, mobileToken).expect(204);

      await unstar(competition.id, mobileToken).expect(204);

      const res = await getFavorites(mobileToken).expect(200);
      expect(res.body).toEqual([]);
    });

    it('should be idempotent when the competition is not starred', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();

      await unstar(competition.id, mobileToken).expect(204);
    });

    it('should not remove the favorites of other users', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();
      await star(competition.id, mobileToken).expect(204);
      await star(competition.id, otherMobileToken).expect(204);

      await unstar(competition.id, mobileToken).expect(204);

      const res = await getFavorites(otherMobileToken).expect(200);
      expect(res.body).toEqual([competition.id]);
    });

    it('should reject ADMIN role (403)', async () => {
      await unstar(1, adminToken).expect(403);
    });

    it('should reject unauthenticated request (401)', async () => {
      await request(getApp().getHttpServer()).delete(`${API}/1`).expect(401);
    });
  });

  // ==================== Cascades DB ====================

  describe('FK cascades', () => {
    afterEach(async () => {
      // Purge les users temporaires (id > 3) créés par ces tests de cascade.
      await getSeedHelper().cleanUsers();
    });

    const countFavorites = async (where: string, id: number): Promise<number> => {
      const rows = await getApp()
        .get(DataSource)
        .query<
          { n: number }[]
        >(`SELECT count(*)::int AS n FROM user_favorites WHERE ${where} = $1`, [id]);
      return rows[0].n;
    };

    it('should purge favorites when the user is deleted (RGPD)', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();
      const userRepo = getApp().get(DataSource).getRepository(UserEntity);
      const tempUser = await userRepo.save(
        userRepo.create({ email: 'temp-cascade@test.com', roles: 'MOBILE' }),
      );
      const tempToken = getAuthHelper().generateToken(tempUser.id, 'temp-cascade@test.com', [
        Role.MOBILE,
      ]);

      await star(competition.id, tempToken).expect(204);
      expect(await countFavorites('user_id', tempUser.id)).toBe(1);

      // Même opération finale que `deleteAccount` (RGPD) : DELETE de la ligne user.
      await userRepo.delete({ id: tempUser.id });

      expect(await countFavorites('user_id', tempUser.id)).toBe(0);
    });

    it('should purge favorites when the competition is deleted', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();
      await star(competition.id, mobileToken).expect(204);
      expect(await countFavorites('competition_id', competition.id)).toBe(1);

      await getApp()
        .get(DataSource)
        .query('DELETE FROM competition WHERE id = $1', [competition.id]);

      expect(await countFavorites('competition_id', competition.id)).toBe(0);
    });
  });
});
