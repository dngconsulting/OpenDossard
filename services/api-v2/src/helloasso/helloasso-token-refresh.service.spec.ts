import { BadGatewayException, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { HelloAssoTokenRefreshService } from './helloasso-token-refresh.service';
import { encryptToken } from './util/token-crypto.util';

interface Mocks {
  service: HelloAssoTokenRefreshService;
  oauth: { refreshAccessToken: jest.Mock };
  details: { findExpiringLinks: jest.Mock; applyRefreshedTokens: jest.Mock };
  key: Buffer;
}

function makeService(opts: { enabled?: boolean } = {}): Mocks {
  const key = randomBytes(32);
  const config = {
    tokenEncryptionKey: key,
    tokenRefreshEnabled: opts.enabled ?? true,
  } as HelloAssoConfig;
  const oauth = { refreshAccessToken: jest.fn() };
  const details = {
    findExpiringLinks: jest.fn().mockResolvedValue([]),
    applyRefreshedTokens: jest.fn().mockResolvedValue(undefined),
  };
  const service = new HelloAssoTokenRefreshService(
    config,
    oauth as unknown as HelloAssoOAuthService,
    details as unknown as HelloAssoDetailsService,
  );
  return { service, oauth, details, key };
}

function makeLink(key: Buffer, clubId: number, refreshToken: string): HelloAssoDetailsEntity {
  return {
    id: clubId,
    clubId,
    organizationSlug: `club-${clubId}`,
    accessTokenEncrypted: encryptToken('AT', key),
    refreshTokenEncrypted: encryptToken(refreshToken, key),
    accessTokenExpiresAt: new Date('2026-08-22T03:30:00Z'),
    refreshTokenExpiresAt: new Date('2026-08-27T03:00:00Z'),
    linkedByUserId: 55,
    linkedAt: new Date('2026-07-28T03:00:00Z'),
    lastRefreshedAt: null,
    isCashInCompliant: true,
    createdAt: new Date('2026-07-28T03:00:00Z'),
    updatedAt: new Date('2026-07-28T03:00:00Z'),
  };
}

function okTokens(refreshToken = 'RT_NEW') {
  return { accessToken: 'AT_NEW', refreshToken, tokenType: 'bearer', expiresIn: 1800 };
}

describe('HelloAssoTokenRefreshService — garde-fous', () => {
  afterEach(() => jest.restoreAllMocks());

  it('flag désarmé : le cron ne déclenche AUCUN appel HelloAsso', async () => {
    const m = makeService({ enabled: false });

    await m.service.handleCron();

    expect(m.details.findExpiringLinks).not.toHaveBeenCalled();
    expect(m.oauth.refreshAccessToken).not.toHaveBeenCalled();
    expect(m.details.applyRefreshedTokens).not.toHaveBeenCalled();
  });

  it('flag armé : le cron lance un run avec le seuil de 10 jours', async () => {
    const m = makeService({ enabled: true });

    await m.service.handleCron();

    expect(m.details.findExpiringLinks).toHaveBeenCalledWith(10);
  });

  it('aucun candidat : run vide, synthèse à zéro', async () => {
    const m = makeService();

    const summary = await m.service.refreshExpiringLinks();

    expect(summary).toMatchObject({ candidates: 0, refreshed: 0, rejected: 0, failed: 0 });
    expect(m.oauth.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('ré-entrance : un second run concurrent est ignoré', async () => {
    const m = makeService();
    let release!: () => void;
    m.details.findExpiringLinks.mockReturnValueOnce(
      new Promise(resolve => {
        release = () => resolve([]);
      }),
    );

    const first = m.service.refreshExpiringLinks();
    const second = await m.service.refreshExpiringLinks();

    expect(second.candidates).toBe(0);
    expect(m.details.findExpiringLinks).toHaveBeenCalledTimes(1);

    release();
    await first;
  });

  it('libère le garde de ré-entrance même si le run échoue', async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockRejectedValueOnce(new Error('DB down'));

    await expect(m.service.refreshExpiringLinks()).rejects.toThrow('DB down');

    // le garde doit être relâché, sinon le job est mort jusqu'au redémarrage
    m.details.findExpiringLinks.mockResolvedValueOnce([]);
    await expect(m.service.refreshExpiringLinks()).resolves.toMatchObject({ candidates: 0 });
  });
});

describe('HelloAssoTokenRefreshService — cas nominal', () => {
  afterEach(() => jest.restoreAllMocks());

  it('déchiffre le RT, appelle HelloAsso, persiste les nouveaux tokens', async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([makeLink(m.key, 782, 'RT_CLAIR')]);
    m.oauth.refreshAccessToken.mockResolvedValueOnce(okTokens('RT2'));

    const summary = await m.service.refreshExpiringLinks();

    // le token est passé EN CLAIR à HelloAsso, donc déchiffré depuis la DB
    expect(m.oauth.refreshAccessToken).toHaveBeenCalledWith('RT_CLAIR');
    expect(m.details.applyRefreshedTokens).toHaveBeenCalledWith(782, {
      accessToken: 'AT_NEW',
      refreshToken: 'RT2',
      expiresInSeconds: 1800,
    });
    expect(summary).toMatchObject({ candidates: 1, refreshed: 1, rejected: 0, failed: 0 });
  });

  it("traite les clubs séquentiellement, dans l'ordre reçu", async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([
      makeLink(m.key, 1, 'RT1'),
      makeLink(m.key, 2, 'RT2'),
      makeLink(m.key, 3, 'RT3'),
    ]);
    m.oauth.refreshAccessToken.mockResolvedValue(okTokens());

    const summary = await m.service.refreshExpiringLinks();

    expect(m.oauth.refreshAccessToken.mock.calls.map((c: unknown[]) => c[0])).toEqual([
      'RT1',
      'RT2',
      'RT3',
    ]);
    expect(summary.refreshed).toBe(3);
  });

  it("n'appelle jamais HelloAsso en parallèle (rate limit + lisibilité des logs)", async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([
      makeLink(m.key, 1, 'RT1'),
      makeLink(m.key, 2, 'RT2'),
    ]);
    let inFlight = 0;
    let maxInFlight = 0;
    m.oauth.refreshAccessToken.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return okTokens();
    });

    await m.service.refreshExpiringLinks();

    expect(maxInFlight).toBe(1);
  });
});

describe('HelloAssoTokenRefreshService — erreurs', () => {
  afterEach(() => jest.restoreAllMocks());

  it("un 401 sur un club n'interrompt pas le run", async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([
      makeLink(m.key, 1, 'RT_MORT'),
      makeLink(m.key, 2, 'RT_OK'),
    ]);
    m.oauth.refreshAccessToken
      .mockRejectedValueOnce(new UnauthorizedException('HelloAsso rejected the token request'))
      .mockResolvedValueOnce(okTokens());

    const summary = await m.service.refreshExpiringLinks();

    expect(summary).toMatchObject({ candidates: 2, refreshed: 1, rejected: 1, failed: 0 });
    expect(m.details.applyRefreshedTokens).toHaveBeenCalledTimes(1);
    expect(m.details.applyRefreshedTokens).toHaveBeenCalledWith(2, expect.anything());
  });

  it("un 502 compte en échec et n'écrit rien", async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([makeLink(m.key, 1, 'RT')]);
    m.oauth.refreshAccessToken.mockRejectedValueOnce(
      new BadGatewayException('HelloAsso token endpoint failed'),
    );

    const summary = await m.service.refreshExpiringLinks();

    expect(summary).toMatchObject({ candidates: 1, refreshed: 0, rejected: 0, failed: 1 });
    expect(m.details.applyRefreshedTokens).not.toHaveBeenCalled();
  });

  it('réponse 200 sans refresh_token : AUCUNE écriture, on ne casse pas un lien valide', async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([makeLink(m.key, 1, 'RT')]);
    m.oauth.refreshAccessToken.mockResolvedValueOnce({
      accessToken: 'AT_NEW',
      refreshToken: '',
      tokenType: 'bearer',
      expiresIn: 1800,
    });

    const summary = await m.service.refreshExpiringLinks();

    expect(m.details.applyRefreshedTokens).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ refreshed: 0, failed: 1 });
  });

  it('ligne indéchiffrable : échec isolé, le run continue', async () => {
    const m = makeService();
    const corrupted = makeLink(m.key, 1, 'RT');
    corrupted.refreshTokenEncrypted = 'nimporte.quoi.ici';
    m.details.findExpiringLinks.mockResolvedValueOnce([corrupted, makeLink(m.key, 2, 'RT_OK')]);
    m.oauth.refreshAccessToken.mockResolvedValueOnce(okTokens());

    const summary = await m.service.refreshExpiringLinks();

    expect(summary).toMatchObject({ candidates: 2, refreshed: 1, failed: 1 });
    expect(m.oauth.refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('un échec de persistance ne compte pas comme un refresh réussi', async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([makeLink(m.key, 1, 'RT')]);
    m.oauth.refreshAccessToken.mockResolvedValueOnce(okTokens());
    m.details.applyRefreshedTokens.mockRejectedValueOnce(new Error('deadlock'));

    const summary = await m.service.refreshExpiringLinks();

    expect(summary).toMatchObject({ refreshed: 0, failed: 1 });
  });

  it('ne logge jamais un token, chiffré ou non', async () => {
    const m = makeService();
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const link = makeLink(m.key, 1, 'RT_SECRET');
    m.details.findExpiringLinks.mockResolvedValueOnce([link]);
    m.oauth.refreshAccessToken.mockRejectedValueOnce(new UnauthorizedException());

    await m.service.refreshExpiringLinks();

    const emitted = [...warn.mock.calls, ...log.mock.calls, ...error.mock.calls].flat().join(' ');
    expect(emitted).not.toContain('RT_SECRET');
    expect(emitted).not.toContain(link.refreshTokenEncrypted);
    expect(emitted).toContain('clubId=1');
    expect(emitted).toContain('club-1');
  });
});

describe('HelloAssoTokenRefreshService — observabilité', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renseigne durationMs et désigne le club le plus lent', async () => {
    const m = makeService();
    m.details.findExpiringLinks.mockResolvedValueOnce([
      makeLink(m.key, 1, 'RT1'),
      makeLink(m.key, 2, 'RT2'),
    ]);
    m.oauth.refreshAccessToken.mockResolvedValue(okTokens());

    // Le Logger Nest consomme lui aussi Date.now() pour ses horodatages : on le
    // neutralise pour que la séquence de ticks ne reflète QUE les mesures du
    // service (startedAt, puis clubStartedAt/fin pour chaque club, puis total).
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const ticks = [0, 0, 100, 100, 5_100, 5_200];
    let i = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => ticks[Math.min(i++, ticks.length - 1)]);

    const summary = await m.service.refreshExpiringLinks();

    expect(summary.durationMs).toBe(5_200);
    expect(summary.slowestClubId).toBe(2);
    expect(summary.slowestMs).toBe(5_000);
  });

  it('logge une synthèse portant tous les compteurs et la durée', async () => {
    const m = makeService();
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    await m.service.refreshExpiringLinks();

    const line = log.mock.calls.flat().join(' ');
    expect(line).toMatch(/candidats=0/);
    expect(line).toMatch(/rafraîchis=0/);
    expect(line).toMatch(/rejetés=0/);
    expect(line).toMatch(/échecs=0/);
    expect(line).toMatch(/durationMs=\d+/);
  });

  it('bascule la synthèse en warn au-delà de 5 minutes', async () => {
    const m = makeService();
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const ticks = [0, 6 * 60 * 1000];
    let i = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => ticks[Math.min(i++, ticks.length - 1)]);

    await m.service.refreshExpiringLinks();

    expect(warn.mock.calls.flat().join(' ')).toMatch(/run anormalement long/);
  });

  it('annonce ARMÉ ou DÉSARMÉ au boot', () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    makeService({ enabled: false }).service.onModuleInit();
    expect(log.mock.calls.flat().join(' ')).toContain('DÉSARMÉ');

    log.mockClear();
    makeService({ enabled: true }).service.onModuleInit();
    expect(log.mock.calls.flat().join(' ')).toContain('ARMÉ');
  });

  it('logge la durée de chaque club, sans jamais exposer de token', async () => {
    const m = makeService();
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    m.details.findExpiringLinks.mockResolvedValueOnce([makeLink(m.key, 7, 'RT_SECRET')]);
    m.oauth.refreshAccessToken.mockResolvedValueOnce(okTokens());

    await m.service.refreshExpiringLinks();

    const emitted = log.mock.calls.flat().join(' ');
    expect(emitted).toMatch(/clubId=7 slug=club-7.*durationMs=\d+/);
    expect(emitted).not.toContain('RT_SECRET');
  });
});
