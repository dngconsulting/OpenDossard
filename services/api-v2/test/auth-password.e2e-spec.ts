import { randomUUID } from 'node:crypto';
import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';

/**
 * Le hash du mot de passe ne doit sortir d'aucune réponse, et la colonne étant
 * en `select: false`, la connexion et le changement de mot de passe doivent
 * toujours le relire explicitement. Mots de passe générés à l'exécution.
 */
describe('Mot de passe : exposition et authentification (e2e)', () => {
  let adminToken: string;

  const http = () => request(getApp().getHttpServer());

  const createUser = async (password: string) => {
    const res = await http()
      .post('/api/v2/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `${randomUUID()}@test.com`, password, firstName: 'Hash', lastName: 'Test' })
      .expect(201);
    return res.body as { id: number; email: string };
  };

  const login = (email: string, password: string) =>
    http().post('/api/v2/auth/login').send({ email, password });

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanUsers();
  });

  describe("aucune réponse /users n'expose le hash", () => {
    it('POST, GET liste, GET détail, PATCH', async () => {
      const created = await createUser(randomUUID());
      expect(created).not.toHaveProperty('password');

      const list = await http()
        .get('/api/v2/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const rows = (list.body as { data: object[] }).data;
      expect(rows.length).toBeGreaterThan(0);
      rows.forEach(row => expect(row).not.toHaveProperty('password'));

      const one = await http()
        .get(`/api/v2/users/${created.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(one.body).not.toHaveProperty('password');
      expect(one.body).toMatchObject({ id: created.id, email: created.email, firstName: 'Hash' });

      const patched = await http()
        .patch(`/api/v2/users/${created.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Modifié' })
        .expect(200);
      expect(patched.body).not.toHaveProperty('password');
      expect(patched.body).toMatchObject({ firstName: 'Modifié' });
    });
  });

  describe('POST /auth/login', () => {
    it('connecte avec le bon mot de passe sans renvoyer le hash', async () => {
      const password = randomUUID();
      const { email } = await createUser(password);

      const res = await login(email, password).expect(200);
      const body = res.body as { accessToken: string; user: object };
      expect(body.accessToken).toBeDefined();
      expect(body.user).not.toHaveProperty('password');
    });

    it('refuse un mauvais mot de passe', async () => {
      const { email } = await createUser(randomUUID());
      await login(email, randomUUID()).expect(401);
    });
  });

  describe('changement de mot de passe', () => {
    it('reset par un ADMIN : le nouveau mot de passe remplace l’ancien', async () => {
      const oldPassword = randomUUID();
      const newPassword = randomUUID();
      const { id, email } = await createUser(oldPassword);

      await http()
        .post(`/api/v2/users/${id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword })
        .expect(201);

      await login(email, newPassword).expect(200);
      await login(email, oldPassword).expect(401);
    });

    it('change-password par l’utilisateur : vérifie l’actuel puis enregistre le nouveau', async () => {
      const currentPassword = randomUUID();
      const newPassword = randomUUID();
      const { email } = await createUser(currentPassword);
      const token = (
        (await login(email, currentPassword).expect(200)).body as { accessToken: string }
      ).accessToken;

      await http()
        .post('/api/v2/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: randomUUID(), newPassword })
        .expect(401);

      await http()
        .post('/api/v2/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword, newPassword })
        .expect(200);

      await login(email, newPassword).expect(200);
      await login(email, currentPassword).expect(401);
    });
  });
});
