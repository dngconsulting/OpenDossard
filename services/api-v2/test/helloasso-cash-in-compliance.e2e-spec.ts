import { UnauthorizedException } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, In } from 'typeorm';

import { Federation } from '../src/common/enums';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { HelloAssoDetailsEntity } from '../src/helloasso/entities/helloasso-details.entity';
import { HelloAssoConfig } from '../src/helloasso/helloasso.config';
import { HelloAssoApiClient } from '../src/helloasso/helloasso-api.client';
import { encryptToken } from '../src/helloasso/util/token-crypto.util';
import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';

const refreshUrl = (clubId: number) =>
  `/api/v2/helloasso/clubs/${clubId}/cash-in-compliance/refresh`;

/** Utilisateur ORGANISATEUR du jeu de données e2e (cf. `getOrgaToken`). */
const ORGA_USER_ID = 2;

/**
 * HelloAsso est mocké au niveau de `HelloAssoApiClient.getOrganization` ; le
 * jeton club semé est valide 20 minutes, donc aucun refresh n'est tenté (le
 * chemin refresh est couvert par les tests unitaires du service).
 */
describe('HelloAsso — rafraîchissement manuel de la conformité encaissement (e2e)', () => {
  let dataSource: DataSource;
  let clubIdSeq = 0;
  /** Base testcontainer partagée : on ne nettoie QUE les lignes semées ici. */
  let seededClubIds: number[] = [];
  let getOrganization: jest.SpyInstance;

  beforeAll(() => {
    dataSource = getApp().get(DataSource);
  });

  beforeEach(() => {
    getOrganization = jest
      .spyOn(getApp().get(HelloAssoApiClient), 'getOrganization')
      .mockResolvedValue({ isCashInCompliant: true });
  });

  afterEach(async () => {
    getOrganization.mockRestore();
    await getSeedHelper().cleanUserClubs();
    if (seededClubIds.length > 0) {
      await dataSource.getRepository(HelloAssoDetailsEntity).delete({ clubId: In(seededClubIds) });
      await dataSource.getRepository(ClubEntity).delete({ id: In(seededClubIds) });
      seededClubIds = [];
    }
  });

  async function seedClub(): Promise<number> {
    clubIdSeq += 1;
    const club = await dataSource.getRepository(ClubEntity).save({
      longName: `Club conformité ${Date.now()}-${clubIdSeq}`,
      shortName: `CC${clubIdSeq}`,
      dept: '82',
      federation: Federation.FSGT,
    });
    seededClubIds.push(club.id);
    return club.id;
  }

  /** Club lié à HelloAsso, drapeau `false` comme lu au callback. */
  async function seedLinkedClub(): Promise<number> {
    const clubId = await seedClub();
    const key = getApp().get(HelloAssoConfig).tokenEncryptionKey;
    await dataSource.getRepository(HelloAssoDetailsEntity).save({
      clubId,
      organizationSlug: `orga-conformite-${clubId}`,
      accessTokenEncrypted: encryptToken('AT_CLUB', key),
      refreshTokenEncrypted: encryptToken('RT_CLUB', key),
      accessTokenExpiresAt: new Date(Date.now() + 20 * 60 * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + 20 * 24 * 3600 * 1000),
      linkedByUserId: null,
      linkedAt: new Date(),
      lastRefreshedAt: null,
      isCashInCompliant: false,
    });
    return clubId;
  }

  async function storedFlag(clubId: number): Promise<boolean | null> {
    const link = await dataSource
      .getRepository(HelloAssoDetailsEntity)
      .findOneOrFail({ where: { clubId } });
    return link.isCashInCompliant;
  }

  it('refuse un appel anonyme', async () => {
    const clubId = await seedLinkedClub();
    await request(getApp().getHttpServer()).post(refreshUrl(clubId)).expect(401);
  });

  it('ADMIN : relit le drapeau, l’enregistre et renvoie le statut à jour', async () => {
    const clubId = await seedLinkedClub();

    const res = await request(getApp().getHttpServer())
      .post(refreshUrl(clubId))
      .set('Authorization', `Bearer ${getAuthHelper().getAdminToken()}`)
      .expect(200);

    expect(getOrganization).toHaveBeenCalledWith({
      organizationSlug: `orga-conformite-${clubId}`,
      accessToken: 'AT_CLUB',
    });
    expect(res.body).toMatchObject({ linked: true, isCashInCompliant: true });
    expect(await storedFlag(clubId)).toBe(true);
  });

  it('enregistre aussi un retour à false', async () => {
    const clubId = await seedLinkedClub();
    await dataSource
      .getRepository(HelloAssoDetailsEntity)
      .update({ clubId }, { isCashInCompliant: true });
    getOrganization.mockResolvedValue({ isCashInCompliant: false });

    await request(getApp().getHttpServer())
      .post(refreshUrl(clubId))
      .set('Authorization', `Bearer ${getAuthHelper().getAdminToken()}`)
      .expect(200);

    expect(await storedFlag(clubId)).toBe(false);
  });

  it('ORGANISATEUR du club : autorisé', async () => {
    const clubId = await seedLinkedClub();
    await getSeedHelper().seedUserClubs([{ userId: ORGA_USER_ID, clubId }]);

    await request(getApp().getHttpServer())
      .post(refreshUrl(clubId))
      .set('Authorization', `Bearer ${getAuthHelper().getOrgaToken()}`)
      .expect(200);

    expect(await storedFlag(clubId)).toBe(true);
  });

  it('ORGANISATEUR d’un autre club : 403, aucun appel HelloAsso', async () => {
    const clubId = await seedLinkedClub();

    await request(getApp().getHttpServer())
      .post(refreshUrl(clubId))
      .set('Authorization', `Bearer ${getAuthHelper().getOrgaToken()}`)
      .expect(403);

    expect(getOrganization).not.toHaveBeenCalled();
    expect(await storedFlag(clubId)).toBe(false);
  });

  it('club non lié : 404', async () => {
    const clubId = await seedClub();

    await request(getApp().getHttpServer())
      .post(refreshUrl(clubId))
      .set('Authorization', `Bearer ${getAuthHelper().getAdminToken()}`)
      .expect(404);
  });

  it('HelloAsso refuse le jeton club : 409 (jamais 401), drapeau inchangé', async () => {
    const clubId = await seedLinkedClub();
    getOrganization.mockRejectedValue(new UnauthorizedException());

    await request(getApp().getHttpServer())
      .post(refreshUrl(clubId))
      .set('Authorization', `Bearer ${getAuthHelper().getAdminToken()}`)
      .expect(409);

    expect(await storedFlag(clubId)).toBe(false);
  });
});
