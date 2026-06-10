import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper } from './setup-e2e';
import { Role } from '../src/common/enums';

const API = '/api/v2/devices';

/**
 * Enregistrement / désenregistrement des tokens FCM.
 *
 * Couvre le finding M6 (audit OWASP 2026-06-10) : `DELETE /devices/:token`
 * doit être scopé au user courant — un user ne peut pas désenregistrer le
 * token d'un autre (sinon il peut couper les push de n'importe qui en
 * énumérant/volant des tokens).
 */
describe('Devices (e2e)', () => {
  let mobileToken: string;
  /** Second user avec rôle MOBILE (user id 2, rôle porté par le JWT). */
  let otherMobileToken: string;

  beforeAll(() => {
    mobileToken = getAuthHelper().getMobileToken();
    otherMobileToken = getAuthHelper().generateToken(2, 'orga@test.com', [Role.MOBILE]);
  });

  afterEach(async () => {
    await getApp().get(DataSource).query('TRUNCATE TABLE "device_token_notifs" CASCADE');
  });

  const registerDevice = (fcmToken: string, authToken: string) =>
    request(getApp().getHttpServer())
      .post(API)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: fcmToken, platform: 'ios' });

  const unregisterDevice = (fcmToken: string, authToken: string) =>
    request(getApp().getHttpServer())
      .delete(`${API}/${fcmToken}`)
      .set('Authorization', `Bearer ${authToken}`);

  const countTokens = async (fcmToken: string): Promise<number> => {
    const rows = await getApp()
      .get(DataSource)
      .query<
        { n: number }[]
      >('SELECT count(*)::int AS n FROM device_token_notifs WHERE token = $1', [fcmToken]);
    return rows[0].n;
  };

  it('should register then unregister own device token', async () => {
    await registerDevice('fcm-token-own', mobileToken).expect(204);
    expect(await countTokens('fcm-token-own')).toBe(1);

    await unregisterDevice('fcm-token-own', mobileToken).expect(204);
    expect(await countTokens('fcm-token-own')).toBe(0);
  });

  it('should NOT unregister a token belonging to another user (M6)', async () => {
    await registerDevice('fcm-token-victim', mobileToken).expect(204);

    // Un autre user tente de supprimer le token : 204 (idempotent, pas de
    // fuite d'existence) mais le token de la victime DOIT rester.
    await unregisterDevice('fcm-token-victim', otherMobileToken).expect(204);

    expect(await countTokens('fcm-token-victim')).toBe(1);
  });

  it('should reject unauthenticated unregister (401)', async () => {
    await request(getApp().getHttpServer()).delete(`${API}/whatever`).expect(401);
  });
});
