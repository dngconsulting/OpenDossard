import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailConfig } from './mail.config';
import { MailMessage, MailService } from './mail.service';

const CLE_FACTICE = 'cle-factice';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function makeConfigService(values: Record<string, string | undefined>): ConfigService {
  return {
    get: <T>(key: string, defaultValue?: T): T | string =>
      values[key] !== undefined ? values[key] : (defaultValue as T),
  } as unknown as ConfigService;
}

function makeService(values: Record<string, string | undefined>): MailService {
  const configService = makeConfigService(values);
  return new MailService(new MailConfig(configService), configService);
}

const MESSAGE: MailMessage = {
  to: 'coureur@example.com',
  subject: 'Réinitialisation de votre mot de passe',
  html: '<p>Bonjour</p>',
  text: 'Bonjour',
  debugLink: 'https://app.local/reset-password#token=lien-de-debug',
};

const SEND_ENV = {
  MAIL_MODE: 'send',
  BREVO_API_KEY: CLE_FACTICE,
  MAIL_FROM: 'noreply@opendossard.com',
  MAIL_FROM_NAME: 'Open Dossard',
};

function brevoResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Tous les arguments passés aux spies du Logger, aplatis en texte. */
function loggedText(...spies: jest.SpyInstance[]): string {
  return spies
    .flatMap(spy => spy.mock.calls as unknown[][])
    .map(args => JSON.stringify(args))
    .join('\n');
}

function sentBody(fetchSpy: jest.SpyInstance): Record<string, unknown> {
  const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

describe('MailService', () => {
  let fetchSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('mode log', () => {
    it("n'effectue aucun appel réseau et logue destinataire, sujet et lien hors production", async () => {
      const service = makeService({ NODE_ENV: 'development' });
      await service.send(MESSAGE);

      expect(fetchSpy).not.toHaveBeenCalled();
      const logs = loggedText(logSpy);
      expect(logs).toContain(MESSAGE.to);
      expect(logs).toContain(MESSAGE.subject);
      expect(logs).toContain(MESSAGE.debugLink);
    });

    it("en production (log explicite) : avertit et n'expose jamais le debugLink", async () => {
      const service = makeService({ NODE_ENV: 'production', MAIL_MODE: 'log' });
      await service.send(MESSAGE);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(loggedText(warnSpy)).toContain('MAIL_MODE=log');
      expect(loggedText(logSpy, warnSpy, errorSpy)).not.toContain(MESSAGE.debugLink);
    });
  });

  describe('config invalide (désactivé)', () => {
    it.each([
      [{ NODE_ENV: 'production' }, /MAIL_MODE est obligatoire/],
      [{ MAIL_MODE: 'bogus' }, /MAIL_MODE invalide/],
      [{ ...SEND_ENV, BREVO_API_KEY: '' }, /BREVO_API_KEY/],
      [{ ...SEND_ENV, MAIL_MODE: 'redirect' }, /MAIL_REDIRECT_TO/],
    ])(
      "%j : démarre, n'appelle pas Brevo, logue une erreur sans lien et résout",
      async (env, reason) => {
        // Instanciation sans throw : l'API démarre (l'erreur de boot est testée
        // dans mail.config.spec.ts).
        const service = makeService(env);
        errorSpy.mockClear();

        await expect(service.send(MESSAGE)).resolves.toBeUndefined();

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        const logged = String((errorSpy.mock.calls as unknown[][])[0][0]);
        expect(logged).toContain(`Email NON envoyé à ${MESSAGE.to}`);
        expect(logged).toContain(MESSAGE.subject);
        expect(logged).toContain('configuration mail invalide');
        expect(logged).toMatch(reason);
        const logs = loggedText(logSpy, warnSpy, errorSpy);
        expect(logs).not.toContain(MESSAGE.debugLink);
        expect(logs).not.toContain('reset-password');
        expect(logs).not.toContain(CLE_FACTICE);
      },
    );
  });

  describe('mode send', () => {
    it('appelle Brevo une seule fois avec le contrat attendu', async () => {
      fetchSpy.mockResolvedValue(brevoResponse(201, { messageId: '<id@relay>' }));
      const service = makeService(SEND_ENV);
      await service.send(MESSAGE);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(BREVO_URL);
      expect(init.method).toBe('POST');
      const headers = init.headers as Record<string, string>;
      expect(headers['api-key']).toBe(CLE_FACTICE);
      expect(headers['content-type']).toBe('application/json');
      expect(headers.accept).toBe('application/json');
      expect(init.signal).toBeInstanceOf(AbortSignal);

      expect(sentBody(fetchSpy)).toEqual({
        sender: { email: 'noreply@opendossard.com', name: 'Open Dossard' },
        to: [{ email: MESSAGE.to }],
        subject: MESSAGE.subject,
        htmlContent: MESSAGE.html,
        textContent: MESSAGE.text,
      });

      const logs = loggedText(logSpy);
      expect(logs).toContain(MESSAGE.to);
      expect(logs).toContain('<id@relay>');
      expect(logs).not.toContain(CLE_FACTICE);
      expect(logs).not.toContain(MESSAGE.debugLink);
    });

    it("omet le nom d'expéditeur quand MAIL_FROM_NAME est absent", async () => {
      fetchSpy.mockResolvedValue(brevoResponse(201, { messageId: '<id@relay>' }));
      const service = makeService({ ...SEND_ENV, MAIL_FROM_NAME: undefined });
      await service.send(MESSAGE);

      expect(sentBody(fetchSpy).sender).toEqual({ email: 'noreply@opendossard.com' });
    });

    it('réponse 401 → rejet avec le status, sans la clé ni le corps envoyé', async () => {
      fetchSpy.mockResolvedValue(
        brevoResponse(401, { code: 'unauthorized', message: 'Key not found' }),
      );
      const service = makeService(SEND_ENV);

      const erreur = await service.send(MESSAGE).then(
        () => null,
        (e: unknown) => e as Error,
      );
      expect(erreur).toBeInstanceOf(Error);
      expect(erreur?.message).toContain('401');
      expect(erreur?.message).toContain('Key not found');
      expect(erreur?.message).not.toContain(CLE_FACTICE);
      expect(erreur?.message).not.toContain(MESSAGE.html);
    });

    it("tronque un message d'erreur Brevo trop long", async () => {
      fetchSpy.mockResolvedValue(brevoResponse(400, { message: 'x'.repeat(1000) }));
      const service = makeService(SEND_ENV);

      const erreur = await service.send(MESSAGE).then(
        () => null,
        (e: unknown) => e as Error,
      );
      expect(erreur?.message).toContain('400');
      expect(erreur?.message.length).toBeLessThan(400);
    });

    it('réponse non JSON → rejet avec le status', async () => {
      fetchSpy.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
      const service = makeService(SEND_ENV);

      await expect(service.send(MESSAGE)).rejects.toThrow(/502/);
    });
  });

  describe('mode redirect', () => {
    it('remplace le destinataire et préfixe le sujet avec le destinataire initial', async () => {
      fetchSpy.mockResolvedValue(brevoResponse(201, { messageId: '<id@relay>' }));
      const service = makeService({
        ...SEND_ENV,
        MAIL_MODE: 'redirect',
        MAIL_REDIRECT_TO: 'boite-test@opendossard.com',
      });
      await service.send(MESSAGE);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const body = sentBody(fetchSpy);
      expect(body.to).toEqual([{ email: 'boite-test@opendossard.com' }]);
      expect(body.subject).toBe(`[Redirigé → ${MESSAGE.to}] ${MESSAGE.subject}`);
    });
  });
});
