import * as request from 'supertest';

import { getApp, getAuthHelper } from './setup-e2e';
import {
  cleanRankedChallenge,
  seedRankedChallenge,
  seedTopCutChallenge,
} from './helpers/challenge-lifecycle.seed';
import { ChallengeEntity } from '../src/challenges/entities/challenge.entity';
import { LicenceEntity } from '../src/licences/entities/licence.entity';
import { PalmaresChallengeDto, PalmaresResponseDto } from '../src/races/dto';

const CHALLENGES_API = '/api/v2/challenges';
const PALMARES_API = '/api/v2/races/palmares';

describe('Palmarès : challenges multi-courses terminés (e2e)', () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  afterEach(async () => {
    await cleanRankedChallenge();
  });

  const close = (id: number) =>
    request(getApp().getHttpServer())
      .post(`${CHALLENGES_API}/${id}/close`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

  const getChallenges = async (licenceId: number, token = adminToken) =>
    (
      (
        await request(getApp().getHttpServer())
          .get(`${PALMARES_API}/${licenceId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
      ).body as PalmaresResponseDto
    ).challenges;

  it('renvoie le rang, les points et les épreuves du coureur dans un challenge terminé', async () => {
    const { challenge, bravo, charlie } = await seedRankedChallenge();
    await close(challenge.id);

    const [bravoChallenge] = await getChallenges(bravo.id);
    expect(bravoChallenge).toEqual<PalmaresChallengeDto>({
      challengeId: challenge.id,
      challengeName: 'Challenge cycle de vie',
      competitionType: 'ROUTE',
      closedAt: expect.any(String) as string,
      firstEventDate: expect.stringMatching(/^2025-05-01/) as string,
      gender: 'H',
      catev: '2',
      rank: 1,
      ptsAllRaces: 2,
      nbRaces: 2,
    });

    const [charlieChallenge] = await getChallenges(charlie.id);
    expect(charlieChallenge).toMatchObject({ rank: 3, ptsAllRaces: 1, nbRaces: 1 });
  });

  it('exclut les challenges en cours (pas d’archive, pas de rang)', async () => {
    const { bravo } = await seedRankedChallenge();
    expect(await getChallenges(bravo.id)).toEqual([]);
  });

  it('retire le challenge à la réouverture', async () => {
    const { challenge, bravo } = await seedRankedChallenge();
    await close(challenge.id);
    await request(getApp().getHttpServer())
      .post(`${CHALLENGES_API}/${challenge.id}/reopen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(await getChallenges(bravo.id)).toEqual([]);
  });

  it('garde un challenge terminé masqué dans l’app (active = false)', async () => {
    const { challenge, bravo, ds } = await seedRankedChallenge();
    await close(challenge.id);
    await ds.getRepository(ChallengeEntity).update(challenge.id, { active: false });

    expect((await getChallenges(bravo.id)).map(c => c.challengeId)).toEqual([challenge.id]);
  });

  it('trie par première épreuve, la plus récente d’abord', async () => {
    const { challenge, bravo, ds } = await seedRankedChallenge();
    // Second challenge limité à la seconde épreuve (1er juin) : il passe devant le premier (1er mai).
    const later = await ds.getRepository(ChallengeEntity).save(
      ds.getRepository(ChallengeEntity).create({
        name: 'Challenge de juin',
        active: true,
        competitionIds: [challenge.competitionIds[1]],
        bareme: 'BAREME_ASSIDUITE',
        competitionType: 'ROUTE',
      }),
    );
    await close(challenge.id);
    await close(later.id);

    const challenges = await getChallenges(bravo.id);
    expect(challenges.map(c => [c.challengeId, c.nbRaces])).toEqual([
      [later.id, 1],
      [challenge.id, 2],
    ]);
    expect(challenges[0].firstEventDate).toMatch(/^2025-06-01/);
  });

  it('n’inclut pas un coureur hors du top 20 archivé, garde les ex æquo au 20e rang', async () => {
    const { challenge, ds } = await seedTopCutChallenge();
    await close(challenge.id);
    const repo = ds.getRepository(LicenceEntity);
    const out = await repo.findOneByOrFail({ name: 'OUT01' });
    const dnf = await repo.findOneByOrFail({ name: 'DNF01' });

    expect(await getChallenges(out.id)).toEqual([]);
    expect(await getChallenges(dnf.id)).toEqual([
      expect.objectContaining({ challengeId: challenge.id, rank: 20 }),
    ]);
  });

  it('est accessible au rôle MOBILE', async () => {
    const { challenge, bravo } = await seedRankedChallenge();
    await close(challenge.id);

    const challenges = await getChallenges(bravo.id, getAuthHelper().getMobileToken());
    expect(challenges).toHaveLength(1);
  });
});
