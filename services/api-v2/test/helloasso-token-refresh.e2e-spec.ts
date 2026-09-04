import { DataSource, In } from 'typeorm';

import { Federation } from '../src/common/enums';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { HelloAssoDetailsEntity } from '../src/helloasso/entities/helloasso-details.entity';
import { HelloAssoDetailsService } from '../src/helloasso/helloasso-details.service';
import { HelloAssoTokenRefreshService } from '../src/helloasso/helloasso-token-refresh.service';
import { getApp } from './setup-e2e';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ces tests tapent un vrai PostgreSQL (testcontainer) : c'est le seul endroit
 * où l'on vérifie que la fenêtre de sélection fonctionne réellement en SQL.
 * `refresh_token_expires_at` est un `timestamp without time zone` comparé à des
 * `Date` JS — un décalage de fuseau ferait silencieusement rater des liaisons en
 * production, et aucun repo mocké ne peut l'attraper.
 */
describe('HelloAsso — renouvellement des tokens (e2e)', () => {
  let dataSource: DataSource;
  let detailsService: HelloAssoDetailsService;
  let clubIdSeq = 0;

  /**
   * La base testcontainer est partagée entre les fichiers e2e : on ne nettoie
   * QUE les lignes semées ici, jamais la table entière.
   */
  let seededClubIds: number[] = [];

  beforeAll(() => {
    dataSource = getApp().get(DataSource);
    detailsService = getApp().get(HelloAssoDetailsService);
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  async function cleanup(): Promise<void> {
    if (seededClubIds.length === 0) return;
    await dataSource.getRepository(HelloAssoDetailsEntity).delete({ clubId: In(seededClubIds) });
    await dataSource.getRepository(ClubEntity).delete({ id: In(seededClubIds) });
    seededClubIds = [];
  }

  /** Crée un club + sa liaison HelloAsso expirant dans `expiresInDays` jours. */
  async function seedLink(expiresInDays: number): Promise<number> {
    clubIdSeq += 1;
    const suffix = `${Date.now()}-${clubIdSeq}`;
    const club = await dataSource.getRepository(ClubEntity).save({
      longName: `Club refresh ${suffix}`,
      shortName: `CR${clubIdSeq}`,
      dept: '31',
      federation: Federation.FSGT,
    });
    await dataSource.getRepository(HelloAssoDetailsEntity).save({
      clubId: club.id,
      organizationSlug: `orga-${suffix}`,
      accessTokenEncrypted: 'iv.tag.ct',
      refreshTokenEncrypted: 'iv.tag.ct',
      accessTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + expiresInDays * DAY_MS),
      linkedByUserId: null,
      linkedAt: new Date(),
      lastRefreshedAt: null,
      isCashInCompliant: true,
    });
    seededClubIds.push(club.id);
    return club.id;
  }

  it('le job est bien enregistré dans le contexte Nest', () => {
    expect(getApp().get(HelloAssoTokenRefreshService)).toBeInstanceOf(HelloAssoTokenRefreshService);
  });

  it('findExpiringLinks(10) ne retient que la fenêtre ]now, now+10j[', async () => {
    await seedLink(-1); // expirée hier → hors fenêtre (borne basse)
    const inWindow = await seedLink(5); // dans la fenêtre
    await seedLink(25); // trop loin → hors fenêtre (borne haute)

    const found = await detailsService.findExpiringLinks(10);

    expect(found.map(l => l.clubId)).toEqual([inWindow]);
  });

  it("trie par expiration croissante — les plus urgents d'abord", async () => {
    const far = await seedLink(9);
    const near = await seedLink(2);
    const middle = await seedLink(6);

    const found = await detailsService.findExpiringLinks(10);

    expect(found.map(l => l.clubId)).toEqual([near, middle, far]);
  });

  it("applyRefreshedTokens repousse l'expiration de 30j sans toucher au slug ni à linkedAt", async () => {
    const clubId = await seedLink(3);
    const repo = dataSource.getRepository(HelloAssoDetailsEntity);
    const before = await repo.findOneOrFail({ where: { clubId } });

    await detailsService.applyRefreshedTokens(clubId, {
      accessToken: 'AT_NEW',
      refreshToken: 'RT_NEW',
      expiresInSeconds: 1800,
    });

    const after = await repo.findOneOrFail({ where: { clubId } });
    // la liaison sort de la fenêtre : ~30 jours devant elle
    const remainingDays = (after.refreshTokenExpiresAt.getTime() - Date.now()) / DAY_MS;
    expect(remainingDays).toBeGreaterThan(29);
    expect(after.lastRefreshedAt).not.toBeNull();
    // audit de liaison et garde D1 : intouchés
    expect(after.organizationSlug).toBe(before.organizationSlug);
    expect(after.linkedAt.getTime()).toBe(before.linkedAt.getTime());
    expect(after.isCashInCompliant).toBe(before.isCashInCompliant);
    // et la liaison n'est plus candidate
    const found = await detailsService.findExpiringLinks(10);
    expect(found.map(l => l.clubId)).not.toContain(clubId);
  });
});
