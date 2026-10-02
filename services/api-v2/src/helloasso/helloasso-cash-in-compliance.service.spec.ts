import {
  BadGatewayException,
  ConflictException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoApiClient } from './helloasso-api.client';
import { HelloAssoCashInComplianceService } from './helloasso-cash-in-compliance.service';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { encryptToken } from './util/token-crypto.util';

const CLUB_ID = 1239;
const SLUG = 'cac-cyclisme';
const STATUS = {
  linked: true as const,
  slug: SLUG,
  linkedAt: '2026-09-29T15:36:07.526Z',
  refreshTokenExpiresAt: '2026-10-29T15:36:07.526Z',
  expired: false,
  isCashInCompliant: true,
};

interface Mocks {
  service: HelloAssoCashInComplianceService;
  details: {
    findByClubId: jest.Mock;
    applyRefreshedTokens: jest.Mock;
    setIsCashInCompliantByClubId: jest.Mock;
    getStatus: jest.Mock;
  };
  oauth: { refreshAccessToken: jest.Mock };
  api: { getOrganization: jest.Mock };
  key: Buffer;
}

function makeService(): Mocks {
  const key = randomBytes(32);
  const config = { tokenEncryptionKey: key } as HelloAssoConfig;
  const details = {
    findByClubId: jest.fn(),
    applyRefreshedTokens: jest.fn().mockResolvedValue(undefined),
    setIsCashInCompliantByClubId: jest.fn().mockResolvedValue(1),
    getStatus: jest.fn().mockResolvedValue(STATUS),
  };
  const oauth = { refreshAccessToken: jest.fn() };
  const api = { getOrganization: jest.fn().mockResolvedValue({ isCashInCompliant: true }) };
  const service = new HelloAssoCashInComplianceService(
    config,
    details as unknown as HelloAssoDetailsService,
    oauth as unknown as HelloAssoOAuthService,
    api as unknown as HelloAssoApiClient,
  );
  return { service, details, oauth, api, key };
}

function makeLink(key: Buffer, accessTokenExpiresAt: Date): HelloAssoDetailsEntity {
  return {
    id: 1,
    clubId: CLUB_ID,
    organizationSlug: SLUG,
    accessTokenEncrypted: encryptToken('AT_STORED', key),
    refreshTokenEncrypted: encryptToken('RT_STORED', key),
    accessTokenExpiresAt,
    refreshTokenExpiresAt: new Date(Date.now() + 20 * 24 * 3600 * 1000),
    linkedByUserId: 55,
    linkedAt: new Date('2026-09-29T15:36:07Z'),
    lastRefreshedAt: null,
    isCashInCompliant: false,
    createdAt: new Date('2026-09-29T15:36:07Z'),
    updatedAt: new Date('2026-09-29T15:36:07Z'),
  };
}

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000);

describe('HelloAssoCashInComplianceService.refresh', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('club non lié → NotFoundException, aucun appel HelloAsso', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(null);

    await expect(m.service.refresh(CLUB_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(m.api.getOrganization).not.toHaveBeenCalled();
  });

  it('jeton encore valide → pas de refresh, lecture avec le jeton stocké', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(20)));

    await m.service.refresh(CLUB_ID);

    expect(m.oauth.refreshAccessToken).not.toHaveBeenCalled();
    expect(m.details.applyRefreshedTokens).not.toHaveBeenCalled();
    expect(m.api.getOrganization).toHaveBeenCalledWith({
      organizationSlug: SLUG,
      accessToken: 'AT_STORED',
    });
  });

  it('jeton expiré → refresh, jetons réenregistrés, lecture avec le nouveau jeton', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(-5)));
    m.oauth.refreshAccessToken.mockResolvedValue({
      accessToken: 'AT_NEW',
      refreshToken: 'RT_NEW',
      tokenType: 'bearer',
      expiresIn: 1800,
    });

    await m.service.refresh(CLUB_ID);

    expect(m.oauth.refreshAccessToken).toHaveBeenCalledWith('RT_STORED');
    expect(m.details.applyRefreshedTokens).toHaveBeenCalledWith(CLUB_ID, {
      accessToken: 'AT_NEW',
      refreshToken: 'RT_NEW',
      expiresInSeconds: 1800,
    });
    expect(m.api.getOrganization).toHaveBeenCalledWith({
      organizationSlug: SLUG,
      accessToken: 'AT_NEW',
    });
  });

  it('jeton qui expire dans moins d’une minute → considéré expiré', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, new Date(Date.now() + 30 * 1000)));
    m.oauth.refreshAccessToken.mockResolvedValue({
      accessToken: 'AT_NEW',
      refreshToken: 'RT_NEW',
      tokenType: 'bearer',
      expiresIn: 1800,
    });

    await m.service.refresh(CLUB_ID);

    expect(m.oauth.refreshAccessToken).toHaveBeenCalled();
  });

  it('refresh sans refresh_token → erreur, aucune écriture', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(-5)));
    m.oauth.refreshAccessToken.mockResolvedValue({
      accessToken: 'AT_NEW',
      refreshToken: '',
      tokenType: 'bearer',
      expiresIn: 1800,
    });

    await expect(m.service.refresh(CLUB_ID)).rejects.toBeInstanceOf(BadGatewayException);
    expect(m.details.applyRefreshedTokens).not.toHaveBeenCalled();
    expect(m.details.setIsCashInCompliantByClubId).not.toHaveBeenCalled();
  });

  it('refresh refusé par HelloAsso → ConflictException (liaison à refaire)', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(-5)));
    m.oauth.refreshAccessToken.mockRejectedValue(new UnauthorizedException());

    await expect(m.service.refresh(CLUB_ID)).rejects.toBeInstanceOf(ConflictException);
    expect(m.details.setIsCashInCompliantByClubId).not.toHaveBeenCalled();
  });

  it('jeton club refusé à la lecture → ConflictException, jamais un 401 vers le front', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(20)));
    m.api.getOrganization.mockRejectedValue(new UnauthorizedException());

    await expect(m.service.refresh(CLUB_ID)).rejects.toBeInstanceOf(ConflictException);
  });

  it('organisation introuvable chez HelloAsso → BadGatewayException, pas un 404 « non lié »', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(20)));
    m.api.getOrganization.mockRejectedValue(new NotFoundException());

    await expect(m.service.refresh(CLUB_ID)).rejects.toBeInstanceOf(BadGatewayException);
  });

  it.each([true, false])('drapeau HelloAsso %s → enregistré en base', async value => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(20)));
    m.api.getOrganization.mockResolvedValue({ isCashInCompliant: value });

    await m.service.refresh(CLUB_ID);

    expect(m.details.setIsCashInCompliantByClubId).toHaveBeenCalledWith(CLUB_ID, value);
  });

  it('réponse sans drapeau booléen → BadGatewayException, drapeau inchangé', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(20)));
    m.api.getOrganization.mockResolvedValue({});

    await expect(m.service.refresh(CLUB_ID)).rejects.toBeInstanceOf(BadGatewayException);
    expect(m.details.setIsCashInCompliantByClubId).not.toHaveBeenCalled();
  });

  it('renvoie le statut de liaison à jour', async () => {
    const m = makeService();
    m.details.findByClubId.mockResolvedValue(makeLink(m.key, inMinutes(20)));

    const status = await m.service.refresh(CLUB_ID);

    expect(m.details.getStatus).toHaveBeenCalledWith(CLUB_ID);
    expect(status).toEqual(STATUS);
  });
});
