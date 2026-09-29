import * as request from 'supertest';

import { getApp, getAuthHelper } from './setup-e2e';
import { cleanRankedChallenge, seedRankedChallenge } from './helpers/challenge-lifecycle.seed';
import { ChallengeEntity } from '../src/challenges/entities/challenge.entity';
import { ChallengeRiderDto } from '../src/challenges/dto/challenge-ranking.dto';

const API = '/api/v2/challenges';

/**
 * Clés attendues d'un coureur. Avec BAREME_ASSIDUITE (barème du seed), `explanation`
 * n'est pas renseignée au niveau coureur (seul BAREME_AU_POINTS la calcule), elle est
 * donc absente du JSON, en live comme en archive.
 */
const RIDER_KEYS = [
  'challengeRaceRows',
  'currentClub',
  'currentLicenceCatea',
  'currentLicenceCatev',
  'firstName',
  'gender',
  'licenceId',
  'name',
  'ptsAllRaces',
  'sprintchallenge',
].sort();

const RACE_ROW_KEYS = [
  'catev',
  'comment',
  'competitionId',
  'competitionName',
  'eventDate',
  'explanation',
  'licenceId',
  'nbParticipants',
  'ptsRace',
  'rankingScratch',
  'sprintchallenge',
].sort();

describe('Challenges : rôles et contrat DossardeurV2 (e2e)', () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  afterEach(async () => {
    await cleanRankedChallenge();
  });

  const getRanking = async (id: number) =>
    (
      await request(getApp().getHttpServer())
        .get(`${API}/${id}/ranking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as ChallengeRiderDto[];

  describe('rôles : toutes les mutations sont réservées aux admins', () => {
    it.each([
      ['ORGANISATEUR', () => getAuthHelper().getOrgaToken()],
      ['MOBILE', () => getAuthHelper().getMobileToken()],
    ])('403 pour %s', async (_role, token) => {
      const { challenge } = await seedRankedChallenge();
      const server = getApp().getHttpServer();
      const auth = { Authorization: `Bearer ${token()}` };

      await request(server)
        .post(API)
        .set(auth)
        .send({ name: 'X', bareme: 'B', competitionType: 'ROUTE' })
        .expect(403);
      await request(server)
        .patch(`${API}/${challenge.id}`)
        .set(auth)
        .send({ active: false })
        .expect(403);
      await request(server).delete(`${API}/${challenge.id}`).set(auth).expect(403);
      await request(server).post(`${API}/${challenge.id}/competitions/1`).set(auth).expect(403);
      await request(server).delete(`${API}/${challenge.id}/competitions/1`).set(auth).expect(403);
      await request(server).post(`${API}/${challenge.id}/close`).set(auth).expect(403);
      await request(server).post(`${API}/${challenge.id}/reopen`).set(auth).expect(403);
    });

    it('les lectures restent ouvertes à ORGANISATEUR et MOBILE', async () => {
      const { challenge } = await seedRankedChallenge();
      for (const t of [getAuthHelper().getOrgaToken(), getAuthHelper().getMobileToken()]) {
        await request(getApp().getHttpServer())
          .get(`${API}/${challenge.id}/ranking`)
          .set('Authorization', `Bearer ${t}`)
          .expect(200);
      }
    });
  });

  describe('contrat DossardeurV2', () => {
    it('GET /challenges/:id expose toujours active (booléen) et closedAt en plus', async () => {
      const { challenge } = await seedRankedChallenge();
      const res = await request(getApp().getHttpServer())
        .get(`${API}/${challenge.id}`)
        .set('Authorization', `Bearer ${getAuthHelper().getMobileToken()}`)
        .expect(200);
      expect(typeof (res.body as ChallengeEntity).active).toBe('boolean');
      expect(res.body).toHaveProperty('closedAt', null);
      expect(res.body).not.toHaveProperty('closedBy');
    });

    it('le classement a exactement les clés du DTO, en live puis archivé', async () => {
      const { challenge } = await seedRankedChallenge();
      const keysOf = (ranking: ChallengeRiderDto[]) => ({
        rider: Object.keys(ranking[0]).sort(),
        raceRow: Object.keys(ranking[0].challengeRaceRows[0]).sort(),
      });
      const expected = { rider: RIDER_KEYS, raceRow: RACE_ROW_KEYS };

      expect(keysOf(await getRanking(challenge.id))).toEqual(expected);

      await request(getApp().getHttpServer())
        .post(`${API}/${challenge.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(keysOf(await getRanking(challenge.id))).toEqual(expected);
    });
  });
});
