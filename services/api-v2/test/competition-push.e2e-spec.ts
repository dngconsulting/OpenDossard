import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { Role } from '../src/common/enums';

/**
 * Push organisateur → users ayant starré une épreuve.
 *
 *   POST /api/v2/competitions/:competitionId/push  { message }  [JWT ADMIN|ORGANISATEUR]
 *
 * - ADMIN : toutes les épreuves.
 * - ORGANISATEUR : uniquement les épreuves de ses clubs (`user_club`,
 *   `assertCompetitionAccess`) ; une épreuve sans club est réservée aux ADMIN.
 * - Titre du push = nom de l'épreuve (non saisi par l'organisateur).
 * - Réponse 200 : { targetedUsers, sentDevices }. Dans cette suite, les
 *   starreurs n'ont AUCUN device token → sentDevices = 0 et FCM n'est jamais
 *   appelé (le FIREBASE_ADMIN du setup partagé n'a pas de messaging()).
 */
describe('Competition push (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;
  /** Second user MOBILE (user id 1, rôle porté par le JWT) pour avoir 2 starreurs. */
  let otherMobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
    otherMobileToken = getAuthHelper().generateToken(1, 'admin@test.com', [Role.MOBILE]);
  });

  afterEach(async () => {
    await getSeedHelper().cleanUserClubs();
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanClubs();
  });

  const push = (competitionId: number, token: string, body: object = { message: 'RDV 9h' }) =>
    request(getApp().getHttpServer())
      .post(`/api/v2/competitions/${competitionId}/push`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const star = (competitionId: number, token: string) =>
    request(getApp().getHttpServer())
      .post('/api/v2/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ competitionId });

  it('should let ADMIN push to all starrers and return stats', async () => {
    const clubs = await getSeedHelper().seedClubs();
    const [competition] = await getSeedHelper().seedCompetitions(clubs);
    await star(competition.id, mobileToken).expect(204);
    await star(competition.id, otherMobileToken).expect(204);

    const res = await push(competition.id, adminToken).expect(200);

    // 2 starreurs ciblés, aucun device token enregistré → 0 push parti.
    expect(res.body).toEqual({ targetedUsers: 2, sentDevices: 0 });
  });

  it('should let an ORGANISATEUR push for a competition of his club', async () => {
    const clubs = await getSeedHelper().seedClubs();
    const [competition] = await getSeedHelper().seedCompetitions(clubs);
    await getSeedHelper().seedUserClubs([{ userId: 2, clubId: clubs[0].id }]);
    await star(competition.id, mobileToken).expect(204);

    const res = await push(competition.id, orgaToken).expect(200);

    expect(res.body).toEqual({ targetedUsers: 1, sentDevices: 0 });
  });

  it('should return stats with zero targets when nobody starred', async () => {
    const clubs = await getSeedHelper().seedClubs();
    const [competition] = await getSeedHelper().seedCompetitions(clubs);

    const res = await push(competition.id, adminToken).expect(200);

    expect(res.body).toEqual({ targetedUsers: 0, sentDevices: 0 });
  });

  it('should forbid an ORGANISATEUR not linked to the competition club (403)', async () => {
    const clubs = await getSeedHelper().seedClubs();
    const [competition] = await getSeedHelper().seedCompetitions(clubs);
    // user 2 rattaché à un AUTRE club que celui de la compétition
    await getSeedHelper().seedUserClubs([{ userId: 2, clubId: clubs[1].id }]);

    await push(competition.id, orgaToken).expect(403);
  });

  it('should forbid an ORGANISATEUR on a competition without club (403)', async () => {
    const [competition] = await getSeedHelper().seedCompetitions();
    await getSeedHelper().seedUserClubs([{ userId: 2, clubId: 1 }]);

    await push(competition.id, orgaToken).expect(403);
  });

  it('should reject MOBILE role (403)', async () => {
    const clubs = await getSeedHelper().seedClubs();
    const [competition] = await getSeedHelper().seedCompetitions(clubs);

    await push(competition.id, mobileToken).expect(403);
  });

  it('should return 404 for an unknown competition', async () => {
    await push(999999, adminToken).expect(404);
  });

  it('should return 400 when message is missing or empty', async () => {
    const clubs = await getSeedHelper().seedClubs();
    const [competition] = await getSeedHelper().seedCompetitions(clubs);

    await push(competition.id, adminToken, {}).expect(400);
    await push(competition.id, adminToken, { message: '' }).expect(400);
    // Espaces uniquement = vide après trim → corps de push blanc, refusé.
    await push(competition.id, adminToken, { message: '   ' }).expect(400);
  });

  it('should reject unauthenticated request (401)', async () => {
    await request(getApp().getHttpServer())
      .post('/api/v2/competitions/1/push')
      .send({ message: 'x' })
      .expect(401);
  });
});
