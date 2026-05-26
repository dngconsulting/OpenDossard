import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';

import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
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
