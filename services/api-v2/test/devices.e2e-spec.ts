import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper } from './setup-e2e';
import { Role } from '../src/common/enums';

const API = '/api/v2/devices';

/**
 * Enregistrement / désenregistrement des appareils (push FCM), par `deviceId`.
 *
 * Couvre le finding M6 (audit OWASP 2026-06-10) : le désenregistrement est
 * scopé au user courant — un user ne peut pas désenregistrer l'appareil d'un
 * autre.
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

  const registerDevice = (
    fcmToken: string,
    deviceId: string,
    authToken: string,
    platform: 'ios' | 'android' = 'ios',
  ) =>
    request(getApp().getHttpServer())
      .post(API)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: fcmToken, platform, deviceId });

  const unregisterByDevice = (deviceId: string, authToken: string) =>
    request(getApp().getHttpServer())
      .delete(`${API}/by-device/${deviceId}`)
      .set('Authorization', `Bearer ${authToken}`);

  const countTokens = async (fcmToken: string): Promise<number> => {
    const rows = await getApp()
      .get(DataSource)
      .query<
        { n: number }[]
      >('SELECT count(*)::int AS n FROM device_token_notifs WHERE token = $1', [fcmToken]);
    return rows[0].n;
  };

  const countRowsForUser = async (userId: number): Promise<number> => {
    const rows = await getApp()
      .get(DataSource)
      .query<
        { n: number }[]
      >('SELECT count(*)::int AS n FROM device_token_notifs WHERE user_id = $1', [userId]);
    return rows[0].n;
  };

  it('should reject an unauthenticated request (401)', async () => {
    await request(getApp().getHttpServer()).delete(`${API}/by-device/whatever`).expect(401);
  });

  it('should reject a register without deviceId (400)', async () => {
    await request(getApp().getHttpServer())
      .post(API)
      .set('Authorization', `Bearer ${mobileToken}`)
      .send({ token: 'tok', platform: 'ios' })
      .expect(400);
  });

  describe('device_id upsert & opt-out', () => {
    it('should upsert by device_id when the token rotates (1 row, latest token)', async () => {
      await registerDevice('tok-old', 'device-abc', mobileToken).expect(204);
      await registerDevice('tok-new', 'device-abc', mobileToken).expect(204);

      // Une seule ligne pour cet appareil, avec le token courant ; l'ancien parti.
      expect(await countRowsForUser(3)).toBe(1);
      expect(await countTokens('tok-old')).toBe(0);
      expect(await countTokens('tok-new')).toBe(1);
    });

    it('should reuse the row when the same token resurfaces under a new device_id (iOS reinstall)', async () => {
      // Réinstall iOS : nouveau device_id (MMKV régénéré) mais token FCM
      // conservé (keychain). La ligne doit être réutilisée, pas dupliquée
      // (sinon violation d'unicité du token).
      await registerDevice('tok-keep', 'device-before', mobileToken).expect(204);
      await registerDevice('tok-keep', 'device-after', mobileToken).expect(204);

      expect(await countTokens('tok-keep')).toBe(1);
      expect(await countRowsForUser(3)).toBe(1);
    });

    it('should opt-out by device id (delete the device row)', async () => {
      await registerDevice('tok-optout', 'device-optout', mobileToken).expect(204);
      expect(await countRowsForUser(3)).toBe(1);

      await unregisterByDevice('device-optout', mobileToken).expect(204);

      expect(await countRowsForUser(3)).toBe(0);
    });

    it('should reassign the device row to the new user on account switch + opt-in', async () => {
      // X (user 3) opte-in sur le device partagé.
      await registerDevice('tok-x', 'device-shared', mobileToken).expect(204);
      // Y (user 2) prend le MÊME device et opte-in : la ligne est réaffectée à
      // Y (1 seule ligne par device_id), X n'est plus ciblé via ce device.
      await registerDevice('tok-y', 'device-shared', otherMobileToken).expect(204);

      expect(await countTokens('tok-x')).toBe(0);
      expect(await countTokens('tok-y')).toBe(1);
      expect(await countRowsForUser(3)).toBe(0);
      expect(await countRowsForUser(2)).toBe(1);
    });

    it('should NOT unregister another user device row (M6, by-device path scoped to user)', async () => {
      await registerDevice('tok-victim', 'device-victim', mobileToken).expect(204);

      // Un autre user ne peut pas supprimer la ligne d'autrui par device : 204
      // idempotent, mais la ligne reste (M6 préservé sur le chemin by-device).
      await unregisterByDevice('device-victim', otherMobileToken).expect(204);

      expect(await countTokens('tok-victim')).toBe(1);
    });
  });
});
