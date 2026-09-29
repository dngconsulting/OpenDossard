import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { ChallengeEntity } from '../src/challenges/entities/challenge.entity';
import { ChallengeRiderDto } from '../src/challenges/dto/challenge-ranking.dto';
import { CompetitionType, Federation } from '../src/common/enums';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { LicenceEntity } from '../src/licences/entities/licence.entity';
import { RaceEntity } from '../src/races/entities/race.entity';

const API = '/api/v2/challenges';

/**
 * Deux épreuves FSGT route, trois hommes en catégorie 2, barème assiduité (1 pt par course) :
 *  - ALPHA : 1er puis 2e → 2 pts
 *  - BRAVO : 2e puis 1er → 2 pts, devant ALPHA grâce à la dernière épreuve
 *  - CHARLIE : 3e à la première seulement → 1 pt
 */
async function seedRankedChallenge() {
  const ds = getApp().get(DataSource);
  const comps = await ds.getRepository(CompetitionEntity).save(
    [new Date('2025-05-01T09:00:00Z'), new Date('2025-06-01T09:00:00Z')].map((eventDate, i) =>
      ds.getRepository(CompetitionEntity).create({
        name: `Épreuve ${i + 1}`,
        eventDate,
        zipCode: '31000',
        categories: '1,2,3',
        races: '1/2/3',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
      }),
    ),
  );
  const licences = await ds.getRepository(LicenceEntity).save(
    ['ALPHA', 'BRAVO', 'CHARLIE'].map((name, i) =>
      ds.getRepository(LicenceEntity).create({
        name,
        firstName: name,
        licenceNumber: `9000000${i}`,
        gender: 'H',
        club: 'VC Test',
        dept: '31',
        birthYear: '1985',
        catea: 'S',
        catev: '2',
        fede: Federation.FSGT,
        saison: '2025',
      }),
    ),
  );
  const [alpha, bravo, charlie] = licences;
  const results: [CompetitionEntity, LicenceEntity, number][] = [
    [comps[0], alpha, 1],
    [comps[0], bravo, 2],
    [comps[0], charlie, 3],
    [comps[1], bravo, 1],
    [comps[1], alpha, 2],
  ];
  await ds.getRepository(RaceEntity).save(
    results.map(([comp, lic, rankingScratch], i) =>
      ds.getRepository(RaceEntity).create({
        competitionId: comp.id,
        licenceId: lic.id,
        raceCode: '1/2/3',
        catev: '2',
        catea: 'S',
        riderNumber: 100 + i,
        club: lic.club,
        rankingScratch,
      }),
    ),
  );
  const challenge = await ds.getRepository(ChallengeEntity).save(
    ds.getRepository(ChallengeEntity).create({
      name: 'Challenge cycle de vie',
      active: true,
      competitionIds: comps.map(c => c.id),
      bareme: 'BAREME_ASSIDUITE',
      competitionType: 'ROUTE',
    }),
  );
  return { challenge, alpha, bravo, charlie, ds };
}

describe('Challenges : cycle de vie (e2e)', () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanChallenges();
    await getSeedHelper().cleanRaces();
    await getSeedHelper().cleanLicences();
    await getSeedHelper().cleanCompetitions();
  });

  const getRanking = async (id: number) =>
    (
      await request(getApp().getHttpServer())
        .get(`${API}/${id}/ranking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body as ChallengeRiderDto[];

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
});
