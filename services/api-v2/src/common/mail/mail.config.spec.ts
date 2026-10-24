import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailConfig } from './mail.config';

const CLE_FACTICE = 'cle-factice';

/**
 * ConfigService minimal : `get` sert les valeurs présentes, sinon le défaut.
 * Pas de `new ConfigService({...})` : il lit `process.env` en priorité, ce qui
 * rendrait les tests dépendants de l'environnement du runner.
 */
function makeConfigService(values: Record<string, string | undefined>): ConfigService {
  return {
    get: <T>(key: string, defaultValue?: T): T | string =>
      values[key] !== undefined ? values[key] : (defaultValue as T),
  } as unknown as ConfigService;
}

const SEND_OK = {
  MAIL_MODE: 'send',
  BREVO_API_KEY: CLE_FACTICE,
  MAIL_FROM: 'noreply@opendossard.com',
};

describe('MailConfig', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Instancie sans throw et vérifie l'état désactivé + l'erreur loguée au boot. */
  function expectDisabled(values: Record<string, string | undefined>, reason: RegExp): MailConfig {
    let config: MailConfig | undefined;
    expect(() => {
      config = new MailConfig(makeConfigService(values));
    }).not.toThrow();
    expect(config?.mode).toBe('disabled');
    expect(config?.problems.join(' ; ')).toMatch(reason);
    expect(config?.brevoApiKey).toBe('');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = String((errorSpy.mock.calls as unknown[][])[0][0]);
    expect(logged).toContain("Envoi d'emails désactivé");
    expect(logged).toMatch(reason);
    return config as MailConfig;
  }

  it.each([[undefined], [''], ['   ']])('MAIL_MODE=%s → mode log par défaut, sans erreur', raw => {
    const config = new MailConfig(makeConfigService({ MAIL_MODE: raw }));
    expect(config.mode).toBe('log');
    expect(config.problems).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it.each([[undefined], [''], ['   ']])('production, MAIL_MODE=%s → désactivé', raw => {
    expectDisabled(
      { NODE_ENV: 'production', MAIL_MODE: raw },
      /MAIL_MODE est obligatoire en production \(send, redirect ou log\)/,
    );
  });

  it('production, MAIL_MODE=log explicite → permis', () => {
    const config = new MailConfig(makeConfigService({ NODE_ENV: 'production', MAIL_MODE: 'log' }));
    expect(config.mode).toBe('log');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('production, mode send complet → permis', () => {
    const config = new MailConfig(makeConfigService({ ...SEND_OK, NODE_ENV: 'production' }));
    expect(config.mode).toBe('send');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("mode log : n'exige ni clé, ni expéditeur, ni redirection", () => {
    const config = new MailConfig(makeConfigService({ MAIL_MODE: 'log' }));
    expect(config.mode).toBe('log');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('MAIL_MODE inconnu → désactivé, en listant les valeurs admises', () => {
    expectDisabled({ MAIL_MODE: 'bogus' }, /bogus.*send.*redirect.*log/);
  });

  it('mode send complet → champs lus', () => {
    const config = new MailConfig(
      makeConfigService({ ...SEND_OK, MAIL_FROM_NAME: 'Open Dossard' }),
    );
    expect(config.mode).toBe('send');
    expect(config.problems).toEqual([]);
    expect(config.brevoApiKey).toBe(CLE_FACTICE);
    expect(config.from).toBe('noreply@opendossard.com');
    expect(config.fromName).toBe('Open Dossard');
  });

  it.each([[undefined], ['']])('mode send sans BREVO_API_KEY (%s) → désactivé', raw => {
    expectDisabled({ ...SEND_OK, BREVO_API_KEY: raw }, /BREVO_API_KEY/);
  });

  it.each([[undefined], ['']])('mode send sans MAIL_FROM (%s) → désactivé', raw => {
    const config = expectDisabled({ ...SEND_OK, MAIL_FROM: raw }, /MAIL_FROM/);
    // Une config partiellement valide ne garde aucun champ d'envoi.
    expect(config.from).toBe('');
  });

  it('mode redirect sans MAIL_REDIRECT_TO → désactivé', () => {
    expectDisabled({ ...SEND_OK, MAIL_MODE: 'redirect' }, /MAIL_REDIRECT_TO/);
  });

  it('plusieurs problèmes → une seule ligne qui les liste tous', () => {
    expectDisabled({ MAIL_MODE: 'redirect' }, /BREVO_API_KEY.*MAIL_FROM.*MAIL_REDIRECT_TO/);
  });

  it('mode redirect complet → adresse de redirection lue', () => {
    const config = new MailConfig(
      makeConfigService({
        ...SEND_OK,
        MAIL_MODE: 'redirect',
        MAIL_REDIRECT_TO: 'test@opendossard.com',
      }),
    );
    expect(config.mode).toBe('redirect');
    expect(config.redirectTo).toBe('test@opendossard.com');
  });

  it("la clé n'apparaît jamais dans les problèmes ni dans les logs", () => {
    const configs = [
      { ...SEND_OK, MAIL_FROM: '' },
      { ...SEND_OK, MAIL_MODE: 'redirect' },
      { ...SEND_OK, MAIL_MODE: 'bogus' },
    ].map(values => new MailConfig(makeConfigService(values)));

    expect(errorSpy).toHaveBeenCalledTimes(3);
    for (const config of configs) {
      expect(config.mode).toBe('disabled');
      expect(config.problems.join(' ')).not.toContain(CLE_FACTICE);
    }
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(CLE_FACTICE);
  });
});
