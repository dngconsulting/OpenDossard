import * as request from 'supertest';
import { DataSource, In } from 'typeorm';

import { Federation } from '../src/common/enums';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { HelloAssoDetailsEntity } from '../src/helloasso/entities/helloasso-details.entity';
import { HelloAssoConfig } from '../src/helloasso/helloasso.config';
import { HelloAssoDetailsService } from '../src/helloasso/helloasso-details.service';
import { HelloAssoOAuthService } from '../src/helloasso/helloasso-oauth.service';
import {
  HelloAssoTokenRefreshService,
  RefreshRunSummary,
} from '../src/helloasso/helloasso-token-refresh.service';
import { encryptToken } from '../src/helloasso/util/token-crypto.util';
import { getApp, getAuthHelper } from './setup-e2e';

const RUN_URL = '/api/v2/helloasso/admin/token-refresh/run';

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
  async function seedLink(expiresInDays: number, refreshToken?: string): Promise<number> {
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
      // Chiffré pour de vrai quand le test doit traverser `decryptToken` (run
      // complet via l'endpoint) ; sinon valeur factice, jamais déchiffrée.
      refreshTokenEncrypted: refreshToken
        ? encryptToken(refreshToken, getApp().get(HelloAssoConfig).tokenEncryptionKey)
        : 'iv.tag.ct',
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

  describe(`POST ${RUN_URL} — déclenchement manuel`, () => {
    it('refuse un appel anonyme', async () => {
      await request(getApp().getHttpServer()).post(RUN_URL).expect(401);
    });

    it('refuse un ORGANISATEUR — le déclenchement manuel est réservé aux ADMIN', async () => {
      await request(getApp().getHttpServer())
        .post(RUN_URL)
        .set('Authorization', `Bearer ${getAuthHelper().getOrgaToken()}`)
        .expect(403);
    });

    it('ADMIN : exécute réellement le run et retourne le résumé', async () => {
      const clubId = await seedLink(5, 'RT_OLD');
      const spy = jest
        .spyOn(getApp().get(HelloAssoOAuthService), 'refreshAccessToken')
        .mockResolvedValue({
          accessToken: 'AT_NEW',
          refreshToken: 'RT_NEW',
          expiresIn: 1800,
          tokenType: 'bearer',
        });

      try {
        const res = await request(getApp().getHttpServer())
          .post(RUN_URL)
          .set('Authorization', `Bearer ${getAuthHelper().getAdminToken()}`)
          .expect(200);

        expect(spy).toHaveBeenCalledWith('RT_OLD');
        const summary = res.body as RefreshRunSummary;
        expect(summary).toMatchObject({ refreshed: 1, rejected: 0, failed: 0 });
        expect(summary.candidates).toBeGreaterThanOrEqual(1);

        const after = await dataSource
          .getRepository(HelloAssoDetailsEntity)
          .findOneOrFail({ where: { clubId } });
        expect(after.lastRefreshedAt).not.toBeNull();
      } finally {
        spy.mockRestore();
      }
    });

    it("s'exécute même quand le job planifié est désarmé — c'est tout son intérêt", async () => {
      expect(getApp().get(HelloAssoConfig).tokenRefreshEnabled).toBe(false);

      const res = await request(getApp().getHttpServer())
        .post(RUN_URL)
        .set('Authorization', `Bearer ${getAuthHelper().getAdminToken()}`)
        .expect(200);

      expect(res.body).toHaveProperty('durationMs');
    });
  });
});
