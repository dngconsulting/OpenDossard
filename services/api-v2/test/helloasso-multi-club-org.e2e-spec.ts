import { ConflictException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import { Federation } from '../src/common/enums';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { HelloAssoOrganizationEntity } from '../src/helloasso/entities/helloasso-organization.entity';
import { HelloAssoConfig } from '../src/helloasso/helloasso.config';
import { HelloAssoDetailsService } from '../src/helloasso/helloasso-details.service';
import { decryptToken } from '../src/helloasso/util/token-crypto.util';
import { cleanHelloAssoLinks } from './helpers/helloasso-link.seed';
import { getApp } from './setup-e2e';

/**
 * Une orga HelloAsso, plusieurs clubs (un par fédération).
 *
 * HelloAsso ne garde qu'un grant actif par (partenaire, orga) : une nouvelle
 * autorisation révoque la chaîne précédente (constaté en sandbox le
 * 2026-10-20). La chaîne vit donc sur l'orga, les clubs s'y rattachent.
 */
describe('HelloAsso — plusieurs clubs rattachés à la même orga (e2e)', () => {
  let dataSource: DataSource;
  let details: HelloAssoDetailsService;
  let key: Buffer;
  let seq = 0;
  let clubIds: number[] = [];

  beforeAll(() => {
    dataSource = getApp().get(DataSource);
    details = getApp().get(HelloAssoDetailsService);
    key = getApp().get(HelloAssoConfig).tokenEncryptionKey;
  });

  afterEach(async () => {
    await cleanHelloAssoLinks(dataSource, clubIds);
    await dataSource.getRepository(ClubEntity).delete({ id: In(clubIds) });
    clubIds = [];
  });

  async function seedClub(federation: Federation): Promise<number> {
    seq += 1;
    const club = await dataSource.getRepository(ClubEntity).save({
      longName: `Club multi-orga ${Date.now()}-${seq}`,
      shortName: `CM${seq}`,
      dept: '31',
      federation,
    });
    clubIds.push(club.id);
    return club.id;
  }

  const link = (
    clubId: number,
    slug: string,
    rt: string,
    isCashInCompliant: boolean | null = true,
  ) =>
    details.upsertLink({
      clubId,
      organizationSlug: slug,
      accessToken: `AT-${rt}`,
      refreshToken: rt,
      expiresInSeconds: 1800,
      linkedByUserId: null,
      isCashInCompliant,
    });

  const orgOf = (slug: string) =>
    dataSource
      .getRepository(HelloAssoOrganizationEntity)
      .findOne({ where: { organizationSlug: slug } });

  it('deux clubs sur une orga : une seule orga, la chaîne de la dernière liaison', async () => {
    const slug = `roquettes-${Date.now()}`;
    const fsgt = await seedClub(Federation.FSGT);
    const ufolep = await seedClub(Federation.UFOLEP);

    const first = await link(fsgt, slug, 'RT_1');
    const second = await link(ufolep, slug, 'RT_2');

    expect(second.organizationId).toBe(first.organizationId);
    const org = await orgOf(slug);
    expect(decryptToken(org!.refreshTokenEncrypted, key)).toBe('RT_2');
    // les deux clubs voient la même liaison
    const [sFsgt, sUfolep] = await Promise.all([
      details.getStatus(fsgt),
      details.getStatus(ufolep),
    ]);
    expect(sFsgt).toMatchObject({ linked: true, slug, expired: false });
    expect(sUfolep).toMatchObject({ linked: true, slug, expired: false });
  });

  it('un refresh en vol n’écrase pas la chaîne d’une liaison faite entre-temps', async () => {
    const slug = `roquettes-${Date.now()}`;
    const fsgt = await seedClub(Federation.FSGT);
    const ufolep = await seedClub(Federation.UFOLEP);
    await link(fsgt, slug, 'RT_1');
    // Le refresh (cron ou conformité manuelle) lit la chaîne RT_1…
    const readBeforeRefresh = (await orgOf(slug))!;
    // …pendant que le club UFOLEP passe par la mire : RT_1 est révoquée.
    await link(ufolep, slug, 'RT_2');

    // HelloAsso accepte encore un refresh de RT_1 : son successeur est condamné.
    const written = await details.applyRefreshedTokens(readBeforeRefresh, {
      accessToken: 'AT_1_BIS',
      refreshToken: 'RT_1_BIS',
      expiresInSeconds: 1800,
    });

    expect(written).toBe(false);
    expect(decryptToken((await orgOf(slug))!.refreshTokenEncrypted, key)).toBe('RT_2');
  });

  it('délier un club garde l’orga pour l’autre ; délier le dernier supprime l’orga', async () => {
    const slug = `roquettes-${Date.now()}`;
    const fsgt = await seedClub(Federation.FSGT);
    const ufolep = await seedClub(Federation.UFOLEP);
    await link(fsgt, slug, 'RT_1');
    await link(ufolep, slug, 'RT_2');

    await details.deleteByClubId(ufolep);
    expect(await details.getStatus(ufolep)).toEqual({ linked: false });
    expect(await details.getStatus(fsgt)).toMatchObject({ linked: true, slug });

    await details.deleteByClubId(fsgt);
    expect(await orgOf(slug)).toBeNull();
  });

  it('la conformité est celle de l’orga : un webhook vaut pour tous ses clubs', async () => {
    const slug = `roquettes-${Date.now()}`;
    const fsgt = await seedClub(Federation.FSGT);
    const ufolep = await seedClub(Federation.UFOLEP);
    await link(fsgt, slug, 'RT_1');
    await link(ufolep, slug, 'RT_2');

    expect(await details.setIsCashInCompliantBySlug(slug, false)).toBe(1);

    expect(await details.getStatus(fsgt)).toMatchObject({ isCashInCompliant: false });
    expect(await details.getStatus(ufolep)).toMatchObject({ isCashInCompliant: false });
  });

  it('une conformité illisible à la liaison ne remplace pas la valeur connue', async () => {
    const slug = `roquettes-${Date.now()}`;
    const fsgt = await seedClub(Federation.FSGT);
    const ufolep = await seedClub(Federation.UFOLEP);
    await link(fsgt, slug, 'RT_1', true);

    await link(ufolep, slug, 'RT_2', null);

    expect((await orgOf(slug))!.isCashInCompliant).toBe(true);
  });

  it('garde D1 : un club rattaché ne peut pas basculer vers une autre orga', async () => {
    const fsgt = await seedClub(Federation.FSGT);
    const slugA = `orga-a-${Date.now()}`;
    await link(fsgt, slugA, 'RT_A');

    const slugB = `orga-b-${Date.now()}`;
    await expect(link(fsgt, slugB, 'RT_B')).rejects.toBeInstanceOf(ConflictException);

    expect(await details.getStatus(fsgt)).toMatchObject({ slug: slugA });
    // orga inconnue : jamais créée pour un club refusé
    expect(await orgOf(slugB)).toBeNull();
  });
  it('garde D1 vers une orga connue : conflit, mais la nouvelle chaîne de cette orga est gardée', async () => {
    const fsgt = await seedClub(Federation.FSGT);
    const autre = await seedClub(Federation.UFOLEP);
    const slugX = `orga-x-${Date.now()}`;
    const slugY = `orga-y-${Date.now()}`;
    await link(fsgt, slugX, 'RT_X1');
    await link(autre, slugY, 'RT_Y');

    // La mire de X vient d'émettre RT_X2 (révoquant RT_X1) pour un club lié à Y.
    await expect(link(autre, slugX, 'RT_X2')).rejects.toBeInstanceOf(ConflictException);

    expect(await details.getStatus(autre)).toMatchObject({ slug: slugY });
    expect(decryptToken((await orgOf(slugX))!.refreshTokenEncrypted, key)).toBe('RT_X2');
  });

  it('deux liaisons simultanées sur une orga encore inconnue : toutes deux aboutissent', async () => {
    const slug = `roquettes-${Date.now()}`;
    const fsgt = await seedClub(Federation.FSGT);
    const ufolep = await seedClub(Federation.UFOLEP);

    const [a, b] = await Promise.all([link(fsgt, slug, 'RT_A'), link(ufolep, slug, 'RT_B')]);

    expect(a.organizationId).toBe(b.organizationId);
    const [{ count }]: { count: string }[] = await dataSource.query(
      'SELECT count(*) FROM helloasso_organization WHERE organization_slug = $1',
      [slug],
    );
    expect(Number(count)).toBe(1);
  });

  it('déliaison simultanée des deux derniers clubs : l’orga ne reste pas orpheline', async () => {
    const slug = `roquettes-${Date.now()}`;
    const fsgt = await seedClub(Federation.FSGT);
    const ufolep = await seedClub(Federation.UFOLEP);
    await link(fsgt, slug, 'RT_1');
    await link(ufolep, slug, 'RT_2');

    await Promise.all([details.deleteByClubId(fsgt), details.deleteByClubId(ufolep)]);

    expect(await orgOf(slug)).toBeNull();
  });
});
