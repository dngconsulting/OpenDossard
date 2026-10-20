import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DataSource, FindOperator, Repository } from 'typeorm';

import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoOrganizationEntity } from './entities/helloasso-organization.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { decryptToken, encryptToken } from './util/token-crypto.util';

/** Repository TypeORM mocké : seules les méthodes utilisées par le service. */
interface RepoMock {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneOrFail: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    find: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
    findOneOrFail: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    save: jest.fn().mockImplementation(<T>(e: T) => Promise.resolve({ id: 99, ...e })),
    create: jest.fn().mockImplementation(<T>(data: T) => ({ ...data })),
  };
}

interface QbMock {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  execute: jest.Mock;
}

interface ManagerMock {
  getRepository: jest.Mock;
  /** SQL brut : upsert atomique de l'orga, verrou de l'orga à la déliaison. */
  query: jest.Mock;
  createQueryBuilder: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
  qb: QbMock;
}

interface Mocks {
  service: HelloAssoDetailsService;
  /** Repos injectés ET renvoyés par `manager.getRepository` dans les transactions. */
  links: RepoMock;
  orgs: RepoMock;
  manager: ManagerMock;
  key: Buffer;
}

function makeService(): Mocks {
  const links = makeRepo();
  const orgs = makeRepo();
  const qb: QbMock = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 0, raw: [] }),
  };
  const manager: ManagerMock = {
    getRepository: jest.fn((entity: unknown) =>
      entity === HelloAssoOrganizationEntity ? orgs : links,
    ),
    createQueryBuilder: jest.fn(() => qb),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
    query: jest.fn().mockResolvedValue([{ id: 7 }]),
    qb,
  };
  const dataSource = {
    transaction: jest.fn(<T>(cb: (m: ManagerMock) => Promise<T>) => cb(manager)),
  };
  const key = randomBytes(32);
  const service = new HelloAssoDetailsService(
    links as unknown as Repository<HelloAssoDetailsEntity>,
    orgs as unknown as Repository<HelloAssoOrganizationEntity>,
    { tokenEncryptionKey: key } as HelloAssoConfig,
    dataSource as unknown as DataSource,
  );
  return { service, links, orgs, manager, key };
}

function makeOrg(key: Buffer, overrides: Partial<HelloAssoOrganizationEntity> = {}) {
  return {
    id: 7,
    organizationSlug: 'velo-club-roquettois',
    accessTokenEncrypted: encryptToken('AT_OLD', key),
    refreshTokenEncrypted: encryptToken('RT_OLD', key),
    accessTokenExpiresAt: new Date('2026-10-20T12:30:00Z'),
    refreshTokenExpiresAt: new Date('2026-11-19T12:00:00Z'),
    lastRefreshedAt: new Date('2026-10-01T03:00:00Z'),
    isCashInCompliant: true,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
    ...overrides,
  } as HelloAssoOrganizationEntity;
}

function makeLink(org: HelloAssoOrganizationEntity, clubId = 782): HelloAssoDetailsEntity {
  return {
    id: 1,
    clubId,
    organizationId: org.id,
    organization: org,
    linkedByUserId: 55,
    linkedAt: new Date('2026-09-01T00:00:00Z'),
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
  };
}

const INPUT = {
  clubId: 782,
  organizationSlug: 'velo-club-roquettois',
  accessToken: 'AT_NEW',
  refreshToken: 'RT_NEW',
  expiresInSeconds: 1800,
  linkedByUserId: 55,
  isCashInCompliant: true,
};

describe('HelloAssoDetailsService — upsertLink', () => {
  /** SQL et paramètres de l'écriture de l'orga. */
  function orgWrite(m: Mocks): { sql: string; params: unknown[] } {
    const [sql, params] = m.manager.query.mock.calls[0] as [string, unknown[]];
    return { sql, params };
  }

  it('upsert atomique de l’orga (création ou mise à jour), puis rattachement du club', async () => {
    const m = makeService();
    m.orgs.findOneOrFail.mockResolvedValueOnce(makeOrg(m.key));

    const link = await m.service.upsertLink(INPUT);

    const { sql, params } = orgWrite(m);
    expect(sql).toContain('ON CONFLICT (organization_slug) DO UPDATE');
    expect(params[0]).toBe('velo-club-roquettois');
    expect(decryptToken(params[2] as string, m.key)).toBe('RT_NEW');
    expect(params[5]).toBe(true);
    expect(link).toMatchObject({ clubId: 782, organizationId: 7, linkedByUserId: 55 });
  });

  it('conformité illisible (null) : transmise null, la valeur en place est conservée en SQL', async () => {
    const m = makeService();
    m.orgs.findOneOrFail.mockResolvedValueOnce(makeOrg(m.key));

    await m.service.upsertLink({ ...INPUT, isCashInCompliant: null });

    const { sql, params } = orgWrite(m);
    expect(params[5]).toBeNull();
    expect(sql).toContain('COALESCE(EXCLUDED.is_cash_in_compliant');
  });

  it('re-liaison d’un club déjà rattaché à la même orga : rattachement mis à jour', async () => {
    const m = makeService();
    const org = makeOrg(m.key);
    m.links.findOne.mockResolvedValueOnce(makeLink(org));
    m.orgs.findOneOrFail.mockResolvedValueOnce(org);

    const link = await m.service.upsertLink({ ...INPUT, linkedByUserId: 60 });

    expect(m.links.create).not.toHaveBeenCalled();
    expect(link).toMatchObject({ id: 1, organizationId: 7, linkedByUserId: 60 });
  });

  it('garde D1 : club rattaché à une AUTRE orga → ConflictException, rattachement intact', async () => {
    const m = makeService();
    m.links.findOne.mockResolvedValueOnce(
      makeLink(makeOrg(m.key, { id: 3, organizationSlug: 'autre-orga' })),
    );

    await expect(m.service.upsertLink(INPUT)).rejects.toBeInstanceOf(ConflictException);

    expect(m.links.save).not.toHaveBeenCalled();
    // simple UPDATE de l'orga autorisée si elle existe : jamais de création
    const { sql } = orgWrite(m);
    expect(sql).not.toContain('INSERT');
    expect(sql).toContain('UPDATE helloasso_organization');
  });
});

describe('HelloAssoDetailsService — getStatus', () => {
  it('lit la liaison sur l’orga et la date de rattachement sur le club', async () => {
    const m = makeService();
    m.links.findOne.mockResolvedValueOnce(makeLink(makeOrg(m.key)));

    await expect(m.service.getStatus(782)).resolves.toEqual({
      linked: true,
      slug: 'velo-club-roquettois',
      linkedAt: '2026-09-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2026-11-19T12:00:00.000Z',
      expired: false,
      isCashInCompliant: true,
    });
  });

  it('club non rattaché', async () => {
    const m = makeService();
    await expect(m.service.getStatus(782)).resolves.toEqual({ linked: false });
  });
});

describe('HelloAssoDetailsService — findExpiringOrganizations', () => {
  afterEach(() => jest.useRealTimers());

  it('sélectionne les orgas dans ]now, now+N jours[, les plus urgentes d’abord', async () => {
    const m = makeService();
    m.orgs.find.mockResolvedValueOnce([]);
    jest.useFakeTimers().setSystemTime(new Date('2026-08-22T03:00:00Z'));

    await m.service.findExpiringOrganizations(10);

    const [arg] = m.orgs.find.mock.calls[0] as [
      { where: { refreshTokenExpiresAt: FindOperator<Date> }; order: unknown },
    ];
    expect(arg.order).toEqual({ refreshTokenExpiresAt: 'ASC' });
    const [lower, upper] = arg.where.refreshTokenExpiresAt.value as unknown as FindOperator<Date>[];
    expect(lower.type).toBe('moreThan');
    expect(lower.value).toEqual(new Date('2026-08-22T03:00:00Z'));
    expect(upper.type).toBe('lessThan');
    expect(upper.value).toEqual(new Date('2026-09-01T03:00:00Z'));
  });
});

describe('HelloAssoDetailsService — applyRefreshedTokens', () => {
  afterEach(() => jest.useRealTimers());

  const tokens = { accessToken: 'AT2', refreshToken: 'RT2', expiresInSeconds: 1800 };
  const from = { id: 7, refreshTokenEncrypted: 'iv.tag.RT1' };

  it('écrit sur l’orga si sa chaîne est toujours celle qui a été rafraîchie', async () => {
    const m = makeService();
    jest.useFakeTimers().setSystemTime(new Date('2026-08-22T03:00:00Z'));

    await expect(m.service.applyRefreshedTokens(from, tokens)).resolves.toBe(true);

    const [criteria, patch] = m.orgs.update.mock.calls[0] as [
      object,
      Record<string, string & Date>,
    ];
    expect(criteria).toEqual({ id: 7, refreshTokenEncrypted: 'iv.tag.RT1' });
    expect(decryptToken(patch.refreshTokenEncrypted, m.key)).toBe('RT2');
    expect(patch.accessTokenExpiresAt).toEqual(new Date('2026-08-22T03:30:00Z'));
    expect(patch.refreshTokenExpiresAt).toEqual(new Date('2026-09-21T03:00:00Z'));
    expect(patch.lastRefreshedAt).toEqual(new Date('2026-08-22T03:00:00Z'));
    // ni slug ni conformité : le webhook peut écrire la même ligne
    expect(Object.keys(patch).sort()).toEqual([
      'accessTokenEncrypted',
      'accessTokenExpiresAt',
      'lastRefreshedAt',
      'refreshTokenEncrypted',
      'refreshTokenExpiresAt',
    ]);
  });

  it('chaîne remplacée entre-temps par un passage par la mire : rien écrit, false', async () => {
    const m = makeService();
    m.orgs.update.mockResolvedValueOnce({ affected: 0 });

    await expect(m.service.applyRefreshedTokens(from, tokens)).resolves.toBe(false);
  });
});

describe('HelloAssoDetailsService — deleteByClubId', () => {
  it('NotFoundException si le club n’est pas rattaché', async () => {
    const m = makeService();
    await expect(m.service.deleteByClubId(782)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('désactive le paiement en ligne des compets DU club et supprime le rattachement', async () => {
    const m = makeService();
    m.links.findOne.mockResolvedValueOnce(makeLink(makeOrg(m.key)));

    await m.service.deleteByClubId(782);

    // l'orga est verrouillée avant de compter ses clubs restants
    expect(m.manager.query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [7]);
    expect(m.manager.qb.set).toHaveBeenCalledWith({ onlineRegistrationEnabled: false });
    expect(m.manager.qb.where).toHaveBeenCalledWith('club_id = :clubId', { clubId: 782 });
    expect(m.manager.delete).toHaveBeenCalledWith(HelloAssoDetailsEntity, { id: 1 });
  });

  it('dernier club de l’orga : l’orga est supprimée', async () => {
    const m = makeService();
    m.links.findOne.mockResolvedValueOnce(makeLink(makeOrg(m.key)));
    m.manager.count.mockResolvedValueOnce(0);

    await m.service.deleteByClubId(782);

    expect(m.manager.delete).toHaveBeenCalledWith(HelloAssoOrganizationEntity, { id: 7 });
  });

  it('d’autres clubs restent rattachés : l’orga est conservée', async () => {
    const m = makeService();
    m.links.findOne.mockResolvedValueOnce(makeLink(makeOrg(m.key)));
    m.manager.count.mockResolvedValueOnce(1);

    await m.service.deleteByClubId(782);

    expect(m.manager.delete).not.toHaveBeenCalledWith(
      HelloAssoOrganizationEntity,
      expect.anything(),
    );
  });
});

describe('HelloAssoDetailsService — saveChainIfOrganizationKnown', () => {
  const input = {
    organizationSlug: 'velo-club-roquettois',
    accessToken: 'AT_NEW',
    refreshToken: 'RT_NEW',
    expiresInSeconds: 1800,
  };

  it('orga connue : chaîne neuve enregistrée (UPDATE par slug, jamais de création)', async () => {
    const m = makeService();

    await expect(m.service.saveChainIfOrganizationKnown(input)).resolves.toBe(true);

    const [criteria, patch] = m.orgs.update.mock.calls[0] as [object, Record<string, unknown>];
    expect(criteria).toEqual({ organizationSlug: 'velo-club-roquettois' });
    expect(decryptToken(patch.refreshTokenEncrypted as string, m.key)).toBe('RT_NEW');
    expect(patch.lastRefreshedAt).toBeNull();
    expect(m.orgs.create).not.toHaveBeenCalled();
  });

  it('orga inconnue : rien écrit, false', async () => {
    const m = makeService();
    m.orgs.update.mockResolvedValueOnce({ affected: 0 });

    await expect(m.service.saveChainIfOrganizationKnown(input)).resolves.toBe(false);
  });
});

describe('HelloAssoDetailsService — setIsCashInCompliantBySlug', () => {
  it('met à jour l’orga par slug et renvoie le nombre de lignes affectées', async () => {
    const m = makeService();

    await expect(m.service.setIsCashInCompliantBySlug('velo-club-roquettois', false)).resolves.toBe(
      1,
    );
    expect(m.orgs.update).toHaveBeenCalledWith(
      { organizationSlug: 'velo-club-roquettois' },
      { isCashInCompliant: false },
    );
  });

  it('renvoie 0 pour une orga inconnue (webhook orphelin)', async () => {
    const m = makeService();
    m.orgs.update.mockResolvedValueOnce({ affected: 0 });

    await expect(m.service.setIsCashInCompliantBySlug('inconnue', true)).resolves.toBe(0);
  });
});
