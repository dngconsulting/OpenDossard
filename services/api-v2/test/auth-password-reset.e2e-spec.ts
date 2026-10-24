import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { PasswordResetService } from '../src/auth/password-reset.service';
import { MailService } from '../src/common/mail';
import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';

/**
 * Mot de passe oublié : demande de lien (forgot-password) puis réinitialisation
 * (reset-password). L'envoi d'email est intercepté pour récupérer le lien. Le
 * contrôleur répond sans attendre le traitement : chaque demande attend donc la
 * promesse de `requestReset` (espionnée, implémentation d'origine conservée).
 * Mots de passe générés à l'exécution.
 */
describe('Mot de passe oublié (e2e)', () => {
  let adminToken: string;
  let sendSpy: jest.SpyInstance;
  let requestResetSpy: jest.SpyInstance<Promise<void>, [string]>;

  const http = () => request(getApp().getHttpServer());
  const dataSource = () => getApp().get(DataSource);

  const createUser = async (password: string) => {
    const res = await http()
      .post('/api/v2/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `${randomUUID()}@test.com`, password, firstName: 'Oubli', lastName: 'Test' })
      .expect(201);
    return res.body as { id: number; email: string };
  };

  const login = (email: string, password: string) =>
    http().post('/api/v2/auth/login').send({ email, password });

  const forgot = async (email: string) => {
    const res = await http().post('/api/v2/auth/forgot-password').send({ email }).expect(200);
    const { results } = requestResetSpy.mock;
    expect(results).not.toHaveLength(0);
    await results[results.length - 1].value;
    return res;
  };

  const reset = (token: string, newPassword: string) =>
    http().post('/api/v2/auth/reset-password').send({ token, newPassword });

  type SentMail = { to: string; text: string; debugLink?: string };
  const sentMails = () => sendSpy.mock.calls.map(([message]) => message as SentMail);

  const tokenOf = (mail: SentMail): string => {
    const match = /token=([\w-]+)/.exec(mail.debugLink ?? mail.text);
    if (!match) {
      throw new Error('Aucun token dans le mail envoyé');
    }
    return match[1];
  };

  const lastToken = () => {
    const mails = sentMails();
    return tokenOf(mails[mails.length - 1]);
  };

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  beforeEach(() => {
    sendSpy = jest.spyOn(getApp().get(MailService), 'send').mockResolvedValue();
    requestResetSpy = jest.spyOn(getApp().get(PasswordResetService), 'requestReset');
  });

  afterEach(async () => {
    sendSpy.mockRestore();
    requestResetSpy.mockRestore();
    await getSeedHelper().cleanUsers();
  });

  describe('POST /auth/forgot-password', () => {
    it("répond 200 sans envoyer d'email pour un email inconnu", async () => {
      const res = await forgot(`${randomUUID()}@test.com`);
      expect(res.body).toEqual({ success: true });
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('envoie un seul email au user avec un lien de réinitialisation', async () => {
      const { email } = await createUser(randomUUID());

      const res = await forgot(email);
      expect(res.body).toEqual({ success: true });
      expect(sendSpy).toHaveBeenCalledTimes(1);

      const [mail] = sentMails();
      expect(mail.to).toBe(email);
      expect(mail.debugLink).toMatch(/^https:\/\/e2e\.local\/reset-password#token=[\w-]+$/);
      expect(mail.text).toContain(mail.debugLink);
    });

    it('renvoie le même body pour un email connu et un email inconnu', async () => {
      const { email } = await createUser(randomUUID());

      const known = await forgot(email);
      const unknown = await forgot(`${randomUUID()}@test.com`);
      expect(known.body).toEqual(unknown.body);
    });

    it("n'envoie qu'un email pour deux demandes immédiates (délai entre envois)", async () => {
      const { email } = await createUser(randomUUID());

      await forgot(email);
      await forgot(email);
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('deux demandes simultanées : un seul token actif et un seul email', async () => {
      const { id, email } = await createUser(randomUUID());

      await Promise.all(
        [1, 2].map(() => http().post('/api/v2/auth/forgot-password').send({ email }).expect(200)),
      );
      await Promise.all(requestResetSpy.mock.results.map(result => result.value as Promise<void>));

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const active = await dataSource().query<unknown[]>(
        'SELECT id FROM password_reset_token WHERE user_id = $1 AND used_at IS NULL',
        [id],
      );
      expect(active).toHaveLength(1);
    });

    it('la base refuse un second token actif pour un même user (index partiel)', async () => {
      const { id, email } = await createUser(randomUUID());
      await forgot(email);

      await expect(
        dataSource().query(
          `INSERT INTO password_reset_token (user_id, token_hash, expires_at, created_at)
           VALUES ($1, $2, $3, $3)`,
          [id, 'f'.repeat(64), new Date()],
        ),
      ).rejects.toMatchObject({
        driverError: { code: '23505', constraint: 'UQ_password_reset_token_active_user' },
      });
    });

    it('refuse un email invalide avec un message en français', async () => {
      const res = await http()
        .post('/api/v2/auth/forgot-password')
        .send({ email: 'pas-un-email' })
        .expect(400);
      expect((res.body as { message: string[] }).message).toEqual(['Adresse email invalide']);
      expect(requestResetSpy).not.toHaveBeenCalled();
    });

    it('ne stocke que le hash du token', async () => {
      const { id, email } = await createUser(randomUUID());
      await forgot(email);
      const token = lastToken();

      const rows = await dataSource().query<Record<string, unknown>[]>(
        'SELECT * FROM password_reset_token WHERE user_id = $1',
        [id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].token_hash).not.toBe(token);
      expect(rows[0].token_hash).toHaveLength(64);
      rows.forEach(row =>
        Object.values(row).forEach(value => expect(String(value)).not.toContain(token)),
      );
    });
  });

  describe('POST /auth/reset-password', () => {
    it('remplace le mot de passe avec un token valide', async () => {
      const oldPassword = randomUUID();
      const newPassword = randomUUID();
      const { email } = await createUser(oldPassword);
      await forgot(email);

      const res = await reset(lastToken(), newPassword).expect(200);
      expect(res.body).toEqual({ success: true });

      await login(email, oldPassword).expect(401);
      await login(email, newPassword).expect(200);
    });

    it('refuse la réutilisation d’un token déjà consommé', async () => {
      const { email } = await createUser(randomUUID());
      await forgot(email);
      const token = lastToken();

      await reset(token, randomUUID()).expect(200);
      await reset(token, randomUUID()).expect(400);
    });

    it('refuse un token inventé', async () => {
      const res = await reset(randomUUID(), randomUUID()).expect(400);
      expect((res.body as { message: string }).message).toBe('Lien invalide ou expiré');
    });

    it('refuse un token expiré', async () => {
      const { id, email } = await createUser(randomUUID());
      await forgot(email);
      const token = lastToken();

      await dataSource().query(
        'UPDATE password_reset_token SET expires_at = $1 WHERE user_id = $2',
        [new Date(Date.now() - 60 * 1000), id],
      );

      const res = await reset(token, randomUUID()).expect(400);
      expect((res.body as { message: string }).message).toBe('Lien invalide ou expiré');
    });

    it('une nouvelle demande invalide le token précédent', async () => {
      const { id, email } = await createUser(randomUUID());
      await forgot(email);
      const firstToken = lastToken();

      // Recul du premier token au-delà du délai entre deux envois (60 s).
      await dataSource().query(
        'UPDATE password_reset_token SET created_at = $1 WHERE user_id = $2',
        [new Date(Date.now() - 2 * 60 * 1000), id],
      );

      await forgot(email);
      expect(sendSpy).toHaveBeenCalledTimes(2);
      const secondToken = lastToken();
      expect(secondToken).not.toBe(firstToken);

      await reset(firstToken, randomUUID()).expect(400);
      await reset(secondToken, randomUUID()).expect(200);
    });

    it('rejette un mot de passe trop court sans consommer le token', async () => {
      const newPassword = randomUUID();
      const { email } = await createUser(randomUUID());
      await forgot(email);
      const token = lastToken();

      const res = await reset(token, randomUUID().slice(0, 5)).expect(400);
      expect((res.body as { message: string[] }).message).toEqual([
        'Le mot de passe doit contenir au moins 6 caractères',
      ]);

      await reset(token, newPassword).expect(200);
      await login(email, newPassword).expect(200);
    });
  });
});
