import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DataSource, FindOperator, Repository } from 'typeorm';

import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { decryptToken, encryptToken } from './util/token-crypto.util';

interface Mocks {
  service: HelloAssoDetailsService;
  repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
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
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn().mockImplementation((e: HelloAssoDetailsEntity) => Promise.resolve(e)),
    create: jest
      .fn()
      .mockImplementation((data: Partial<HelloAssoDetailsEntity>) => ({ id: 1, ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
  };
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
    dataSource as unknown as DataSource,
  );
  return { service, repo, capturedManager, key };
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
    isCashInCompliant: null,
    createdAt: new Date('2026-05-12T11:30:00Z'),
    updatedAt: new Date('2026-05-12T11:30:00Z'),
  };
}

describe('HelloAssoDetailsService — upsertLink (lot 3 : refus re-liaison slug différent)', () => {
  const baseInput = {
    clubId: 782,
    organizationSlug: 'cyclo-club-castaneen',
    accessToken: 'a',
    refreshToken: 'r',
    expiresInSeconds: 1800,
    linkedByUserId: 55,
    isCashInCompliant: true,
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

  it('persiste isCashInCompliant à la création (true)', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(null);
    await m.service.upsertLink({ ...baseInput, isCashInCompliant: true });
    expect(m.repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isCashInCompliant: true }),
    );
  });

  it('persiste isCashInCompliant à la création (false)', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(null);
    await m.service.upsertLink({ ...baseInput, isCashInCompliant: false });
    expect(m.repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isCashInCompliant: false }),
    );
  });

  it('persiste isCashInCompliant=null si la valeur HA n’a pas pu être lue', async () => {
    const m = makeService();
    m.repo.findOne.mockResolvedValueOnce(null);
    await m.service.upsertLink({ ...baseInput, isCashInCompliant: null });
    expect(m.repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isCashInCompliant: null }),
    );
  });

  it('met à jour isCashInCompliant sur re-liaison (même slug)', async () => {
    const m = makeService();
    const existing = makeDetails(m.key, 'a', 'r');
    existing.isCashInCompliant = false;
    m.repo.findOne.mockResolvedValueOnce(existing);
    await m.service.upsertLink({ ...baseInput, isCashInCompliant: true });
    expect(m.repo.save).toHaveBeenCalledWith(expect.objectContaining({ isCashInCompliant: true }));
  });
});

describe('HelloAssoDetailsService — setIsCashInCompliantBySlug', () => {
  it('UPDATE par slug et renvoie le nombre de lignes affectées', async () => {
    const m = makeService();
    m.repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

    const affected = await m.service.setIsCashInCompliantBySlug('club-de-judo', true);

    expect(m.repo.update).toHaveBeenCalledWith(
      { organizationSlug: 'club-de-judo' },
      { isCashInCompliant: true },
    );
    expect(affected).toBe(1);
  });

  it('renvoie 0 quand aucune ligne ne correspond (slug orphelin)', async () => {
    const m = makeService();
    m.repo.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

    const affected = await m.service.setIsCashInCompliantBySlug('unknown-slug', false);

    expect(affected).toBe(0);
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

/** Forme de l'argument passé à `repo.find` par `findExpiringLinks`. */
interface FindArg {
  where: { refreshTokenExpiresAt: FindOperator<Date> };
  order: { refreshTokenExpiresAt: 'ASC' | 'DESC' };
}

/** Forme du patch passé à `repo.update` par `applyRefreshedTokens`. */
interface TokenPatch {
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  lastRefreshedAt: Date;
}

describe('HelloAssoDetailsService — findExpiringLinks', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('sélectionne la fenêtre ]now, now+N jours[ et trie par expiration croissante', async () => {
    const m = makeService();
    m.repo.find.mockResolvedValueOnce([]);
    jest.useFakeTimers().setSystemTime(new Date('2026-08-22T03:00:00Z'));

    await m.service.findExpiringLinks(10);

    const [arg] = m.repo.find.mock.calls[0] as [FindArg];
    expect(arg.order).toEqual({ refreshTokenExpiresAt: 'ASC' });

    const criteria = arg.where.refreshTokenExpiresAt;
    expect(criteria.type).toBe('and');
    // And(a, b) porte les deux opérandes dans `value`
    const [lower, upper] = criteria.value as unknown as FindOperator<Date>[];
    // borne basse = now → exclut les liaisons DÉJÀ expirées (HelloAsso les rejetterait)
    expect(lower.type).toBe('moreThan');
    expect(lower.value).toEqual(new Date('2026-08-22T03:00:00Z'));
    // borne haute = now + 10j
    expect(upper.type).toBe('lessThan');
    expect(upper.value).toEqual(new Date('2026-09-01T03:00:00Z'));
  });

  it('remonte les liaisons telles que renvoyées par le repo', async () => {
    const m = makeService();
    const rows = [makeDetails(m.key, 'a', 'b')];
    m.repo.find.mockResolvedValueOnce(rows);

    await expect(m.service.findExpiringLinks(10)).resolves.toBe(rows);
  });
});

describe('HelloAssoDetailsService — applyRefreshedTokens', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const tokens = { accessToken: 'AT2', refreshToken: 'RT2', expiresInSeconds: 1800 };

  it('chiffre les nouveaux tokens et positionne lastRefreshedAt', async () => {
    const m = makeService();
    m.repo.update.mockResolvedValueOnce({ affected: 1 });
    jest.useFakeTimers().setSystemTime(new Date('2026-08-22T03:00:00Z'));

    await m.service.applyRefreshedTokens(782, tokens);

    const [criteria, patch] = m.repo.update.mock.calls[0] as [{ clubId: number }, TokenPatch];
    expect(criteria).toEqual({ clubId: 782 });
    expect(decryptToken(patch.accessTokenEncrypted, m.key)).toBe('AT2');
    expect(decryptToken(patch.refreshTokenEncrypted, m.key)).toBe('RT2');
    expect(patch.accessTokenExpiresAt).toEqual(new Date('2026-08-22T03:30:00Z'));
    expect(patch.refreshTokenExpiresAt).toEqual(new Date('2026-09-21T03:00:00Z'));
    expect(patch.lastRefreshedAt).toEqual(new Date('2026-08-22T03:00:00Z'));
  });

  it("n'écrit QUE les 5 colonnes de tokens — jamais le slug ni l'audit de liaison", async () => {
    const m = makeService();
    m.repo.update.mockResolvedValueOnce({ affected: 1 });

    await m.service.applyRefreshedTokens(782, tokens);

    const [, patch] = m.repo.update.mock.calls[0] as [unknown, TokenPatch];
    expect(Object.keys(patch).sort()).toEqual([
      'accessTokenEncrypted',
      'accessTokenExpiresAt',
      'lastRefreshedAt',
      'refreshTokenEncrypted',
      'refreshTokenExpiresAt',
    ]);
    // garde D1 (slug), audit de liaison, drapeau piloté par webhook : intouchés
    expect(patch).not.toHaveProperty('organizationSlug');
    expect(patch).not.toHaveProperty('linkedAt');
    expect(patch).not.toHaveProperty('linkedByUserId');
    expect(patch).not.toHaveProperty('isCashInCompliant');
  });

  it("n'utilise pas save() — un UPDATE ciblé, pour ne pas écraser isCashInCompliant", async () => {
    const m = makeService();
    m.repo.update.mockResolvedValueOnce({ affected: 1 });

    await m.service.applyRefreshedTokens(782, tokens);

    // le webhook Organization.IsCashinCompliant peut écrire la même ligne
    // pendant le run ; un load→mutate→save réécrirait sa valeur périmée
    expect(m.repo.save).not.toHaveBeenCalled();
    expect(m.repo.findOne).not.toHaveBeenCalled();
  });
});
