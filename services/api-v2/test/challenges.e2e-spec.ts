import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { ChallengeEntity } from '../src/challenges/entities/challenge.entity';

const API = '/api/v2/challenges';

describe('Challenges (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanChallenges();
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanClubs();
  });

  // ==================== GET /challenges ====================

  describe('GET /challenges', () => {
    it('should return all challenges', async () => {
      await getSeedHelper().seedChallenges();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ChallengeEntity[];
      expect(body).toHaveLength(2);
    });

    it('should filter by active=true', async () => {
      await getSeedHelper().seedChallenges();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ active: true })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ChallengeEntity[];
      expect(body).toHaveLength(1);
      expect(body[0].active).toBe(true);
      expect(body[0].name).toBe('Challenge Route FSGT 31');
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

  // ==================== GET /challenges/:id ====================

  describe('GET /challenges/:id', () => {
    it('should return a single challenge', async () => {
      const [challenge] = await getSeedHelper().seedChallenges();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/${challenge.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect((res.body as ChallengeEntity).name).toBe('Challenge Route FSGT 31');
    });

    it('should return 404 for non-existent challenge', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ==================== GET /challenges/:id/ranking ====================

  describe('GET /challenges/:id/ranking', () => {
    it('should return empty ranking when no competitions', async () => {
      const [challenge] = await getSeedHelper().seedChallenges();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/${challenge.id}/ranking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ==================== POST /challenges ====================

  describe('POST /challenges', () => {
    it('should create a challenge as ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nouveau Challenge',
          description: 'Un nouveau challenge de test',
          active: true,
          bareme: 'BAREME_AU_POINTS',
          competitionType: 'ROUTE',
        })
        .expect(201);

      const body = res.body as ChallengeEntity;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Nouveau Challenge');
      expect(body.active).toBe(true);
    });

    it('should create a challenge as ORGANISATEUR', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({
          name: 'Challenge Orga',
          bareme: 'BAREME_ASSIDUITE',
          competitionType: 'CX',
        })
        .expect(201);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({
          name: 'X',
          bareme: 'BAREME_AU_POINTS',
          competitionType: 'ROUTE',
        })
        .expect(403);
    });
  });

  // ==================== PATCH /challenges/:id ====================

  describe('PATCH /challenges/:id', () => {
    it('should update a challenge', async () => {
      const [challenge] = await getSeedHelper().seedChallenges();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${challenge.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Challenge Modifié' })
        .expect(200);

      expect((res.body as ChallengeEntity).name).toBe('Challenge Modifié');
    });
  });

  // ==================== DELETE /challenges/:id ====================

  describe('DELETE /challenges/:id', () => {
    it('should delete a challenge', async () => {
      const [challenge] = await getSeedHelper().seedChallenges();

      await request(getApp().getHttpServer())
        .delete(`${API}/${challenge.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(getApp().getHttpServer())
        .get(`${API}/${challenge.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ==================== POST /challenges/:id/competitions/:competitionId ====================

  describe('POST /challenges/:id/competitions/:competitionId', () => {
    it('should add a competition to a challenge', async () => {
      const [challenge] = await getSeedHelper().seedChallenges();
      const [comp] = await getSeedHelper().seedCompetitions();

      const res = await request(getApp().getHttpServer())
        .post(`${API}/${challenge.id}/competitions/${comp.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const body = res.body as ChallengeEntity;
      expect(body.competitionIds).toContain(comp.id);
    });

    it('should not add duplicate competition', async () => {
      const [challenge] = await getSeedHelper().seedChallenges();
      const [comp] = await getSeedHelper().seedCompetitions();

      // Add once
      await request(getApp().getHttpServer())
        .post(`${API}/${challenge.id}/competitions/${comp.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      // Add again
      const res = await request(getApp().getHttpServer())
        .post(`${API}/${challenge.id}/competitions/${comp.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const body = res.body as ChallengeEntity;
      const count = body.competitionIds.filter(id => id === comp.id).length;
      expect(count).toBe(1);
    });
  });

  // ==================== DELETE /challenges/:id/competitions/:competitionId ====================

  describe('DELETE /challenges/:id/competitions/:competitionId', () => {
    it('should remove a competition from a challenge', async () => {
      const competitions = await getSeedHelper().seedCompetitions();
      const [challenge] = await getSeedHelper().seedChallenges([
        competitions[0].id,
        competitions[1].id,
      ]);

      const res = await request(getApp().getHttpServer())
        .delete(`${API}/${challenge.id}/competitions/${competitions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as ChallengeEntity;
      expect(body.competitionIds).not.toContain(competitions[0].id);
      expect(body.competitionIds).toContain(competitions[1].id);
    });
  });
});
