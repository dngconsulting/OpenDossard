import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

import { HelloAssoConfig } from './helloasso.config';

/**
 * ConfigService minimal : `getOrThrow` sert les valeurs obligatoires,
 * `get` sert les optionnelles avec leur défaut.
 */
function makeConfigService(overrides: Record<string, string | undefined> = {}): ConfigService {
  const base: Record<string, string> = {
    HELLOASSO_CLIENT_ID: 'cid',
    HELLOASSO_CLIENT_SECRET: 'csecret',
    HELLOASSO_OAUTH_BASE_URL: 'https://auth.helloasso-sandbox.com',
    HELLOASSO_API_BASE_URL: 'https://api.helloasso-sandbox.com',
    HELLOASSO_REDIRECT_URI: 'https://test.opendossard.com/api-v2/helloasso/oauth/callback',
    HELLOASSO_FRONT_RESULT_URL: 'https://test.opendossard.com',
    HELLOASSO_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    HELLOASSO_PAYMENT_RETURN_URL_SUCCESS: 'dossardeur://payment/success',
    HELLOASSO_PAYMENT_RETURN_URL_ERROR: 'dossardeur://payment/error',
    HELLOASSO_PAYMENT_RETURN_URL_CANCELLED: 'dossardeur://payment/cancelled',
  };
  const all = { ...base, ...overrides };
  return {
    getOrThrow: (key: string): string => {
      const value = all[key];
      if (value === undefined) throw new Error(`missing ${key}`);
      return value;
    },
    get: <T>(key: string, defaultValue?: T): T | string =>
      all[key] !== undefined ? all[key] : (defaultValue as T),
  } as unknown as ConfigService;
}

describe('HelloAssoConfig — tokenRefreshEnabled', () => {
  it.each([
    ['true', true],
    ['false', false],
    ['', false],
    ['1', false],
    ['TRUE', false],
    [undefined, false],
  ])(
    'HELLOASSO_TOKEN_REFRESH_ENABLED=%s → tokenRefreshEnabled=%s',
    (raw: string | undefined, expected: boolean) => {
      const config = new HelloAssoConfig(
        makeConfigService({ HELLOASSO_TOKEN_REFRESH_ENABLED: raw }),
      );
      expect(config.tokenRefreshEnabled).toBe(expected);
    },
  );

  it("défaut désarmé quand la variable est absente de l'environnement", () => {
    const config = new HelloAssoConfig(makeConfigService());
    expect(config.tokenRefreshEnabled).toBe(false);
  });
});
