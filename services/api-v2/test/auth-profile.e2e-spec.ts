import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper } from './setup-e2e';

const API = '/api/v2/auth';

describe('Auth profile (e2e)', () => {
  let adminToken: string;

  const patchProfile = (body: Record<string, unknown>) =>
    request(getApp().getHttpServer())
      .patch(`${API}/profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  afterAll(async () => {
    // Remet l'admin seedé dans son état initial.
    await getApp()
      .get(DataSource)
      .query(`UPDATE "user" SET phone = NULL, organisation = NULL WHERE id = 1`);
  });

  it('PATCH /auth/profile enregistre organisation et GET /auth/me la renvoie', async () => {
    const res = await patchProfile({
      firstName: 'Admin',
      lastName: 'Test',
      phone: '0612345678',
      organisation: 'Comité FSGT 31',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ phone: '0612345678', organisation: 'Comité FSGT 31' });

    const me = await request(getApp().getHttpServer())
      .get(`${API}/me`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ organisation: 'Comité FSGT 31' });
  });

  it('PATCH /auth/profile sans organisation ne la modifie pas', async () => {
    const init = await patchProfile({
      firstName: 'Admin',
      lastName: 'Test',
      organisation: 'Comité FSGT 31',
    });
    expect(init.status).toBe(200);

    const res = await patchProfile({ firstName: 'Admin', lastName: 'Test' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ organisation: 'Comité FSGT 31' });
  });

  it('PATCH /auth/profile avec organisation null la remet à null', async () => {
    const set = await patchProfile({ firstName: 'Admin', lastName: 'Test', organisation: 'X' });
    expect(set.status).toBe(200);
    expect(set.body).toMatchObject({ organisation: 'X' });

    const cleared = await patchProfile({
      firstName: 'Admin',
      lastName: 'Test',
      organisation: null,
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body).toMatchObject({ organisation: null });
  });

  it('PATCH /auth/profile avec un téléphone null le remet à null', async () => {
    const set = await patchProfile({ firstName: 'Admin', lastName: 'Test', phone: '0612345678' });
    expect(set.status).toBe(200);

    const cleared = await patchProfile({ firstName: 'Admin', lastName: 'Test', phone: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body).toMatchObject({ phone: null });
  });
});
