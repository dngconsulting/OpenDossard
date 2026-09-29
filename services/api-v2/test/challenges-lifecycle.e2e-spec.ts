import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper } from './setup-e2e';
import {
  cleanRankedChallenge,
  seedLargeChallenge,
  seedRankedChallenge,
  seedTopCutChallenge,
} from './helpers/challenge-lifecycle.seed';
import { ChallengeEntity } from '../src/challenges/entities/challenge.entity';
import { ChallengeRiderDto } from '../src/challenges/dto/challenge-ranking.dto';
import { LicenceEntity } from '../src/licences/entities/licence.entity';

const API = '/api/v2/challenges';

describe('Challenges : cycle de vie (e2e)', () => {
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

  const post = (path: string, token = adminToken) =>
    request(getApp().getHttpServer()).post(`${API}${path}`).set('Authorization', `Bearer ${token}`);

  const countArchivedRiders = async (ds: DataSource, challengeId: number) => {
    const [{ count }]: { count: number }[] = await ds.query(
      `SELECT COUNT(*)::int AS count FROM challenge_archive_rider WHERE challenge_id = $1`,
      [challengeId],
    );
    return count;
  };

  const closedByInDb = async (ds: DataSource, challengeId: number) => {
    const [{ closedBy }]: { closedBy: number | null }[] = await ds.query(
      `SELECT closed_by AS "closedBy" FROM challenge WHERE id = $1`,
      [challengeId],
    );
    return closedBy;
  };

  describe('classement live', () => {
    it('départage les ex-æquo par la dernière épreuve et renvoie des nombres', async () => {
      const { challenge } = await seedRankedChallenge();
      const ranking = await getRanking(challenge.id);

      expect(ranking.map(r => [r.name, r.ptsAllRaces])).toEqual([
        ['BRAVO', 2],
        ['ALPHA', 2],
        ['CHARLIE', 1],
      ]);
      expect(ranking[0]).not.toHaveProperty('rank');
      const race = ranking[0].challengeRaceRows[0];
      expect(typeof race.rankingScratch).toBe('number');
      expect(typeof race.nbParticipants).toBe('number');
      expect(race).not.toHaveProperty('currentClub');
    });
  });

  describe('POST /challenges/:id/close', () => {
    it('fige le classement : un changement de catégorie ultérieur ne le modifie plus', async () => {
      const { challenge, bravo, ds } = await seedRankedChallenge();
      const before = await getRanking(challenge.id);

      const res = await post(`/${challenge.id}/close`).expect(201);
      expect((res.body as ChallengeEntity).closedAt).toBeTruthy();
      expect(res.body).not.toHaveProperty('closedBy');

      await ds.getRepository(LicenceEntity).update(bravo.id, { catev: '3', club: 'Autre club' });

      expect(await getRanking(challenge.id)).toEqual(before);
    });

    it.each(['CHALLENGE_FSGT_31', 'BAREME_AU_POINTS', 'BAREME_ASSIDUITE', 'BAREME_INCONNU'])(
      'aller-retour réel par la base identique au live pour le barème %s',
      async bareme => {
        // Ajouté après revue du lot D : le test unitaire du mapper est en mémoire
        // (pas de base, pas de barème réel). Ici : types réels (double precision,
        // timestamp, int), ordre des raceRows, champs null/absents par barème.
        const { challenge, ds } = await seedRankedChallenge();
        await ds.getRepository(ChallengeEntity).update(challenge.id, { bareme });
        const before = await getRanking(challenge.id);
        await post(`/${challenge.id}/close`).expect(201);
        expect(await getRanking(challenge.id)).toEqual(before);
      },
    );

    it('stocke le rang en base, départage inclus', async () => {
      const { challenge, ds } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);

      const rows: { name: string; rank: number }[] = await ds.query(
        `SELECT name, rank FROM challenge_archive_rider WHERE challenge_id = $1 ORDER BY rank, name`,
        [challenge.id],
      );
      expect(rows).toEqual([
        { name: 'BRAVO', rank: 1 },
        { name: 'ALPHA', rank: 2 },
        { name: 'CHARLIE', rank: 3 },
      ]);
    });

    it('n’archive que les ARCHIVE_TOP_N premiers, ex æquo au 20e rang inclus', async () => {
      const { challenge, ds } = await seedTopCutChallenge();
      await post(`/${challenge.id}/close`).expect(201);

      const rows: { name: string; rank: number }[] = await ds.query(
        `SELECT name, rank FROM challenge_archive_rider WHERE challenge_id = $1 ORDER BY rank, name`,
        [challenge.id],
      );
      expect(rows).toHaveLength(21);
      expect(rows.filter(r => r.name.startsWith('DNF'))).toEqual([
        { name: 'DNF01', rank: 20 },
        { name: 'DNF02', rank: 20 },
      ]);
      expect(rows.some(r => r.name.startsWith('OUT'))).toBe(false);
      expect(rows[18]).toEqual({ name: 'TOP19', rank: 19 });
    });

    it('archive plus de 6 000 lignes de courses (limite de 65 535 paramètres de Postgres)', async () => {
      // 20 coureurs × 305 épreuves = 6 100 lignes : un seul INSERT multi-lignes
      // dépasserait la limite de paramètres liés d'une requête Postgres.
      const { challenge, ds } = await seedLargeChallenge(20, 305);
      const before = await getRanking(challenge.id);

      await post(`/${challenge.id}/close`).expect(201);

      const [{ count }]: { count: number }[] = await ds.query(
        `SELECT COUNT(*)::int AS count FROM challenge_archive_race_row rr
           JOIN challenge_archive_rider r ON r.id = rr.archive_rider_id
          WHERE r.challenge_id = $1`,
        [challenge.id],
      );
      expect(count).toBe(6100);
      expect(await getRanking(challenge.id)).toEqual(before);
    });

    it('enregistre l’admin qui a terminé, effacé à la réouverture', async () => {
      const { challenge, ds } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      expect(await closedByInDb(ds, challenge.id)).toBe(1);

      await post(`/${challenge.id}/reopen`).expect(201);
      expect(await closedByInDb(ds, challenge.id)).toBeNull();
    });

    it('409 si déjà terminé', async () => {
      const { challenge } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      await post(`/${challenge.id}/close`).expect(409);
    });

    it('404 si le challenge n’existe pas', async () => {
      await post('/99999/close').expect(404);
    });
  });

  describe('POST /challenges/:id/reopen', () => {
    it('supprime l’archive et repasse en live', async () => {
      const { challenge, bravo, ds } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      await ds.getRepository(LicenceEntity).update(bravo.id, { catev: '3' });

      const res = await post(`/${challenge.id}/reopen`).expect(201);
      expect((res.body as ChallengeEntity).closedAt).toBeNull();
      expect(res.body).not.toHaveProperty('closedBy');

      expect(await countArchivedRiders(ds, challenge.id)).toBe(0);
      const ranking = await getRanking(challenge.id);
      expect(ranking.find(r => r.name === 'BRAVO')?.currentLicenceCatev).toBe('3');
    });

    it('409 si le challenge n’est pas terminé', async () => {
      const { challenge } = await seedRankedChallenge();
      await post(`/${challenge.id}/reopen`).expect(409);
    });
  });

  describe('challenge terminé : verrouillage et suppression', () => {
    const patch = (id: number, body: object) =>
      request(getApp().getHttpServer())
        .patch(`${API}/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(body);

    it('409 sur la modification des courses, du barème ou du type', async () => {
      const { challenge } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);

      await patch(challenge.id, { competitionIds: [] }).expect(409);
      await patch(challenge.id, { bareme: 'BAREME_AU_POINTS' }).expect(409);
      await patch(challenge.id, { competitionType: 'CX' }).expect(409);
      await post(`/${challenge.id}/competitions/1`).expect(409);
      await request(getApp().getHttpServer())
        .delete(`${API}/${challenge.id}/competitions/${challenge.competitionIds[0]}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });

    it('autorise nom, description, règlement et visibilité', async () => {
      const { challenge } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      const res = await patch(challenge.id, { name: 'Saison 2025', active: false }).expect(200);
      expect(res.body).toMatchObject({ name: 'Saison 2025', active: false });
    });

    it('accepte les champs verrouillés renvoyés à l’identique (formulaire complet)', async () => {
      const { challenge } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      const res = await patch(challenge.id, {
        name: 'Renommé',
        bareme: challenge.bareme,
        competitionType: challenge.competitionType,
        competitionIds: challenge.competitionIds,
      }).expect(200);
      expect(res.body).toMatchObject({ name: 'Renommé', bareme: challenge.bareme });
    });

    it('accepte les mêmes épreuves dans un autre ordre, refuse un ensemble différent', async () => {
      const { challenge } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      await patch(challenge.id, { competitionIds: [...challenge.competitionIds].reverse() }).expect(
        200,
      );
      await patch(challenge.id, { competitionIds: [challenge.competitionIds[0]] }).expect(409);
    });

    it('ignore closedAt dans un PATCH (seul reopen rouvre)', async () => {
      const { challenge } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      const res = await patch(challenge.id, { closedAt: null }).expect(200);
      expect((res.body as ChallengeEntity).closedAt).toBeTruthy();
    });

    it('ignore closedBy dans un PATCH sur un challenge terminé', async () => {
      const { challenge, ds } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      await patch(challenge.id, { closedBy: 2 }).expect(200);
      expect(await closedByInDb(ds, challenge.id)).toBe(1);
    });

    it('ignore closedAt et closedBy à la création', async () => {
      const { ds } = await seedRankedChallenge();
      const res = await post('')
        .send({
          name: 'Faux terminé',
          bareme: 'BAREME_ASSIDUITE',
          competitionType: 'ROUTE',
          closedAt: '2025-01-01T00:00:00Z',
          closedBy: 1,
        })
        .expect(201);
      const created = res.body as ChallengeEntity;
      expect(created.closedAt).toBeNull();
      expect(await closedByInDb(ds, created.id)).toBeNull();
    });

    it('DELETE par un admin supprime le challenge et son archive (cascade)', async () => {
      const { challenge, ds } = await seedRankedChallenge();
      await post(`/${challenge.id}/close`).expect(201);
      await request(getApp().getHttpServer())
        .delete(`${API}/${challenge.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const [{ riders }]: { riders: number }[] = await ds.query(
        `SELECT COUNT(*)::int AS riders FROM challenge_archive_rider`,
      );
      const [{ rows }]: { rows: number }[] = await ds.query(
        `SELECT COUNT(*)::int AS rows FROM challenge_archive_race_row`,
      );
      expect({ riders, rows }).toEqual({ riders: 0, rows: 0 });
    });
  });
});
