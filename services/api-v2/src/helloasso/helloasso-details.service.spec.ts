import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';

import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService, HelloAssoTokens } from './helloasso-oauth.service';
import { encryptToken } from './util/token-crypto.util';

interface Mocks {
  service: HelloAssoDetailsService;
  repo: {
    findOne: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  oauth: { refreshTokens: jest.Mock };
  // Capture du dernier `manager` passé à `dataSource.transaction(cb)` pour
  // assertions dans les tests de cascade.
  capturedManager: { lastManager: MockManager | null };
  key: Buffer;
}

// Mock minimal du manager TypeORM utilisé par `deleteByClubId` :
// - `createQueryBuilder().update(Entity).set({...}).where(...).andWhere(...).execute()` pour la cascade
// - `remove(entity)` pour la suppression du lien HA
interface MockQueryBuilder {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  execute: jest.Mock;
}
interface MockManager {
  createQueryBuilder: jest.Mock<MockQueryBuilder, []>;
  remove: jest.Mock;
  /** Référence directe au QB renvoyé par `createQueryBuilder()` (évite
   * `createQueryBuilder.mock.results[0].value` qui force un typage `any`). */
  qb: MockQueryBuilder;
  /** Setter utilisé par les tests pour piloter `execute().affected`. */
  __setAffected: (n: number) => void;
}

function makeMockManager(): MockManager {
  let affected = 0;
  const execute = jest.fn(() => Promise.resolve({ affected, raw: [] }));
  const where = jest.fn().mockReturnThis();
  const andWhere = jest.fn().mockReturnThis();
  const set = jest.fn().mockReturnThis();
  const update = jest.fn().mockReturnThis();
  const qb: MockQueryBuilder = { update, set, where, andWhere, execute };
  const createQueryBuilder = jest.fn<MockQueryBuilder, []>(() => qb);
  const remove = jest.fn().mockResolvedValue(undefined);
  return {
    createQueryBuilder,
    remove,
    qb,
    __setAffected: (n: number) => {
      affected = n;
    },
  };
}

function makeService(): Mocks {
  const repo = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn().mockImplementation((e: HelloAssoDetailsEntity) => Promise.resolve(e)),
    create: jest
      .fn()
      .mockImplementation((data: Partial<HelloAssoDetailsEntity>) => ({ id: 1, ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
  };
  const oauth = { refreshTokens: jest.fn() };
  const key = randomBytes(32);
  const config = { tokenEncryptionKey: key } as HelloAssoConfig;
  const capturedManager: { lastManager: MockManager | null } = { lastManager: null };
  const dataSource = {
    transaction: jest.fn(async <T>(cb: (m: MockManager) => Promise<T>): Promise<T> => {
      const manager = makeMockManager();
      capturedManager.lastManager = manager;
      return cb(manager);
    }),
  };
  const service = new HelloAssoDetailsService(
    repo as unknown as Repository<HelloAssoDetailsEntity>,
    config,
    oauth as unknown as HelloAssoOAuthService,
    dataSource as unknown as DataSource,
  );
  return { service, repo, oauth, capturedManager, key };
}

function makeDetails(
  key: Buffer,
  accessToken: string,
  refreshToken: string,
): HelloAssoDetailsEntity {
  return {
    id: 1,
    clubId: 782,
    organizationSlug: 'cyclo-club-castaneen',
    accessTokenEncrypted: encryptToken(accessToken, key),
    refreshTokenEncrypted: encryptToken(refreshToken, key),
    accessTokenExpiresAt: new Date('2026-05-12T12:00:00Z'),
    refreshTokenExpiresAt: new Date('2026-06-11T12:00:00Z'),
    linkedByUserId: 55,
    linkedAt: new Date('2026-05-12T11:30:00Z'),
    lastRefreshedAt: null,
    createdAt: new Date('2026-05-12T11:30:00Z'),
    updatedAt: new Date('2026-05-12T11:30:00Z'),
  };
}

function freshTokens(overrides: Partial<HelloAssoTokens> = {}): HelloAssoTokens {
  return {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
    tokenType: 'Bearer',
    expiresIn: 1800,
    organizationSlug: 'cyclo-club-castaneen',
    ...overrides,
  };
}

describe('HelloAssoDetailsService — withHelloAssoClubAccessToken', () => {
  it('happy path: calls fn with current access token, no refresh', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValue(makeDetails(m.key, 'curr-access', 'curr-refresh'));
    const fn = jest.fn().mockResolvedValue('ok');

    const result = await m.service.withHelloAssoClubAccessToken(782, fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('curr-access');
    expect(m.oauth.refreshTokens).not.toHaveBeenCalled();
    expect(m.repo.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException if no link exists for clubId', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValue(null);
    const fn = jest.fn();

    await expect(m.service.withHelloAssoClubAccessToken(999, fn)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fn).not.toHaveBeenCalled();
  });

  it('on 401: refreshes tokens, persists, retries fn once with new token, returns result', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValue(makeDetails(m.key, 'expired-access', 'curr-refresh'));
    m.oauth.refreshTokens.mockResolvedValue(freshTokens());

    const fn = jest
      .fn()
      .mockRejectedValueOnce(new UnauthorizedException('HelloAsso rejected'))
      .mockResolvedValueOnce('ok-after-refresh');

    const result = await m.service.withHelloAssoClubAccessToken(782, fn);

    expect(result).toBe('ok-after-refresh');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[0][0]).toBe('expired-access');
    expect(fn.mock.calls[1][0]).toBe('new-access');
    expect(m.oauth.refreshTokens).toHaveBeenCalledWith('curr-refresh');
    expect(m.repo.update).toHaveBeenCalledWith(
      { clubId: 782 },
      expect.objectContaining({
        accessTokenExpiresAt: expect.any(Date),
        refreshTokenExpiresAt: expect.any(Date),
        lastRefreshedAt: expect.any(Date),
        accessTokenEncrypted: expect.any(String),
        refreshTokenEncrypted: expect.any(String),
      }),
    );
    // updateAfterRefresh ne touche PAS linkedAt / linkedByUserId (préservation audit)
    const updateCall = m.repo.update.mock.calls[0][1];
    expect(updateCall).not.toHaveProperty('linkedAt');
    expect(updateCall).not.toHaveProperty('linkedByUserId');
  });

  it('on refresh failure: throws UnauthorizedException with clear message, no retry of fn', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValue(makeDetails(m.key, 'expired-access', 'dead-refresh'));
    m.oauth.refreshTokens.mockRejectedValue(
      new UnauthorizedException('HelloAsso /oauth2/token 401'),
    );

    const fn = jest.fn().mockRejectedValue(new UnauthorizedException('HelloAsso rejected'));

    await expect(m.service.withHelloAssoClubAccessToken(782, fn)).rejects.toMatchObject({
      message: expect.stringContaining('re-passer par la mire'),
    });
    expect(fn).toHaveBeenCalledTimes(1); // pas de retry
    expect(m.repo.update).not.toHaveBeenCalled();
  });

  it('second 401 after refresh: propagates, no third try (no infinite loop)', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValue(makeDetails(m.key, 'expired-access', 'curr-refresh'));
    m.oauth.refreshTokens.mockResolvedValue(freshTokens());

    const fn = jest
      .fn()
      .mockRejectedValueOnce(new UnauthorizedException('first 401'))
      .mockRejectedValueOnce(new UnauthorizedException('still 401 after refresh'));

    await expect(m.service.withHelloAssoClubAccessToken(782, fn)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('non-401 errors propagate without refresh attempt', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValue(makeDetails(m.key, 'curr-access', 'curr-refresh'));

    const fn = jest.fn().mockRejectedValue(new Error('Network timeout'));

    await expect(m.service.withHelloAssoClubAccessToken(782, fn)).rejects.toThrow(
      'Network timeout',
    );
    expect(fn).toHaveBeenCalledTimes(1);
    expect(m.oauth.refreshTokens).not.toHaveBeenCalled();
  });
});

describe('HelloAssoDetailsService — updateAfterRefresh', () => {
  it('persists new tokens and refresh timestamps without touching linkedAt/linkedByUserId', async () => {
    const m = makeService();
    const tokens = freshTokens({ accessToken: 'new-A', refreshToken: 'new-R', expiresIn: 1800 });

    const before = Date.now();
    await m.service.updateAfterRefresh(782, tokens);
    const after = Date.now();

    expect(m.repo.update).toHaveBeenCalledTimes(1);
    const [criteria, updates] = m.repo.update.mock.calls[0];
    expect(criteria).toEqual({ clubId: 782 });

    // Pas de mutation de linkedAt / linkedByUserId
    expect(updates).not.toHaveProperty('linkedAt');
    expect(updates).not.toHaveProperty('linkedByUserId');

    // last_refreshed_at = ~now
    expect(updates.lastRefreshedAt).toBeInstanceOf(Date);
    expect(updates.lastRefreshedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(updates.lastRefreshedAt.getTime()).toBeLessThanOrEqual(after);

    // access_token_expires_at = ~now + expiresIn
    expect(updates.accessTokenExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 1800 * 1000 - 5);
    expect(updates.accessTokenExpiresAt.getTime()).toBeLessThanOrEqual(after + 1800 * 1000 + 5);

    // refresh_token_expires_at = ~now + 30j
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    expect(updates.refreshTokenExpiresAt.getTime()).toBeGreaterThanOrEqual(
      before + THIRTY_DAYS_MS - 5,
    );
    expect(updates.refreshTokenExpiresAt.getTime()).toBeLessThanOrEqual(after + THIRTY_DAYS_MS + 5);

    // Tokens chiffrés (format iv.tag.ct base64url, 3 segments)
    expect(updates.accessTokenEncrypted.split('.')).toHaveLength(3);
    expect(updates.refreshTokenEncrypted.split('.')).toHaveLength(3);
  });
});

describe('HelloAssoDetailsService — upsertLink (lot 3 : refus re-liaison slug différent)', () => {
  const baseInput = {
    clubId: 782,
    organizationSlug: 'cyclo-club-castaneen',
    accessToken: 'a',
    refreshToken: 'r',
    expiresInSeconds: 1800,
    linkedByUserId: 55,
  };

  it('passe et UPDATE si aucune liaison existante', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(null);
    await expect(m.service.upsertLink(baseInput)).resolves.toBeDefined();
    expect(m.repo.create).toHaveBeenCalled();
    expect(m.repo.save).toHaveBeenCalled();
  });

  it('passe si liaison existante avec le même slug (re-liaison normale, refresh expiré)', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(makeDetails(m.key, 'old', 'old'));
    await expect(m.service.upsertLink(baseInput)).resolves.toBeDefined();
    expect(m.repo.save).toHaveBeenCalled();
    expect(m.repo.create).not.toHaveBeenCalled();
  });

  it('refuse avec ConflictException si liaison existante avec un slug DIFFÉRENT', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(makeDetails(m.key, 'old', 'old'));
    await expect(
      m.service.upsertLink({ ...baseInput, organizationSlug: 'orga-frauduleuse' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(m.repo.save).not.toHaveBeenCalled();
  });
});

describe('HelloAssoDetailsService — deleteByClubId (cascade onlineRegistrationEnabled)', () => {
  it('throw NotFoundException si pas de lien HA pour ce clubId', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(null);
    await expect(m.service.deleteByClubId(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('désactive online_registration_enabled sur les compets du club ET supprime le lien, dans la même transaction', async () => {
    const m = makeService();
    const existing = makeDetails(m.key, 'a', 'r');
    m.repo.findOne.mockResolvedValueOnce(existing);

    await m.service.deleteByClubId(782);

    // Manager capturé ; on inspecte les appels QB
    const manager = m.capturedManager.lastManager!;
    expect(manager).not.toBeNull();
    // UPDATE competition SET online_registration_enabled = false WHERE club_id = 782 AND online_registration_enabled = true
    expect(manager.qb.set).toHaveBeenCalledWith({ onlineRegistrationEnabled: false });
    expect(manager.qb.where).toHaveBeenCalledWith('club_id = :clubId', { clubId: 782 });
    expect(manager.qb.andWhere).toHaveBeenCalledWith('online_registration_enabled = true');
    // Puis remove du lien HA
    expect(manager.remove).toHaveBeenCalledWith(existing);
  });

  it("scope strictement par club : le WHERE filtre sur club_id (pas d'update global)", async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(makeDetails(m.key, 'a', 'r'));

    await m.service.deleteByClubId(42);

    // Vérification explicite : l'UPDATE n'est jamais appelé sans WHERE club_id
    expect(m.capturedManager.lastManager!.qb.where).toHaveBeenCalledTimes(1);
    expect(m.capturedManager.lastManager!.qb.where).toHaveBeenCalledWith('club_id = :clubId', {
      clubId: 42,
    });
  });
});
