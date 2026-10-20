import { ConflictException, Logger, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { Repository } from 'typeorm';

import { AuthorizationService } from '../auth/authorization.service';
import { ClubsService } from '../clubs/clubs.service';
import { UserEntity } from '../users/entities/user.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoController } from './helloasso.controller';
import { HelloAssoApiClient } from './helloasso-api.client';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { HelloAssoTokenRefreshService } from './helloasso-token-refresh.service';

/**
 * Raison d'erreur renvoyée à la SPA par le callback OAuth : un échec de
 * l'échange (`exchange_failed`) ne doit pas se confondre avec un échec
 * d'enregistrement de la liaison (`link_failed`) ni avec la garde D1
 * (`linked_to_other_org`).
 */
describe('HelloAssoController — callback : raison d’erreur', () => {
  function makeController() {
    const oauth = {
      consumeCallback: jest.fn().mockResolvedValue({
        userId: 2,
        originClubId: 42,
        organizationSlug: 'velo-club-roquettois',
        tokens: { accessToken: 'AT', refreshToken: 'RT', expiresIn: 1800 },
      }),
    };
    const details = {
      upsertLink: jest.fn().mockResolvedValue({}),
      saveChainIfOrganizationKnown: jest.fn().mockResolvedValue(false),
      findByClubId: jest.fn().mockResolvedValue(null),
    };
    const clubs = {
      findById: jest.fn().mockResolvedValue({ id: 42, helloAssoSlug: 'velo-club-roquettois' }),
    };
    const authorizationService = { assertClubAccess: jest.fn().mockResolvedValue(undefined) };
    const api = { getOrganization: jest.fn().mockResolvedValue({ isCashInCompliant: true }) };
    const userRepository = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 2, email: 'orga@test.fr', getRolesArray: () => [] }),
    };
    const controller = new HelloAssoController(
      oauth as unknown as HelloAssoOAuthService,
      details as unknown as HelloAssoDetailsService,
      clubs as unknown as ClubsService,
      { frontResultUrl: 'https://front.test' } as HelloAssoConfig,
      authorizationService as unknown as AuthorizationService,
      api as unknown as HelloAssoApiClient,
      {} as HelloAssoTokenRefreshService,
      userRepository as unknown as Repository<UserEntity>,
    );
    return { controller, oauth, details, clubs };
  }

  async function redirectOf(controller: HelloAssoController): Promise<URLSearchParams> {
    const redirect = jest.fn();
    await controller.callback('code', 'state', undefined, undefined, undefined, {
      redirect,
    } as unknown as Response);
    const [url] = redirect.mock.calls[0] as [string];
    return new URL(url).searchParams;
  }

  const reasonOf = async (controller: HelloAssoController) =>
    (await redirectOf(controller)).get('reason');

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('échange OAuth refusé par HelloAsso → exchange_failed', async () => {
    const m = makeController();
    m.oauth.consumeCallback.mockRejectedValueOnce(new UnauthorizedException());

    expect(await reasonOf(m.controller)).toBe('exchange_failed');
  });

  it('club déjà rattaché à une autre orga (garde D1) → linked_to_other_org', async () => {
    const m = makeController();
    m.details.upsertLink.mockRejectedValueOnce(new ConflictException('déjà lié'));

    expect(await reasonOf(m.controller)).toBe('linked_to_other_org');
  });

  it('autre échec après l’échange (enregistrement) → link_failed', async () => {
    const m = makeController();
    m.details.upsertLink.mockRejectedValueOnce(new Error('connexion perdue'));

    expect(await reasonOf(m.controller)).toBe('link_failed');
  });

  it('succès → redirection sans raison d’erreur', async () => {
    const m = makeController();

    expect(await reasonOf(m.controller)).toBeNull();
    expect(m.details.upsertLink).toHaveBeenCalledWith(
      expect.objectContaining({ clubId: 42, organizationSlug: 'velo-club-roquettois' }),
    );
  });

  describe('mire aboutie sur une autre association que celle du club', () => {
    it('slug du club différent : confirmation à proposer, avec les deux associations', async () => {
      const m = makeController();
      m.clubs.findById.mockResolvedValueOnce({ id: 42, helloAssoSlug: 'cyclo-club-castaneen' });

      const params = await redirectOf(m.controller);

      expect(params.get('reason')).toBe('no_matching_club');
      expect(params.get('slug')).toBe('velo-club-roquettois');
      expect(params.get('clubSlug')).toBe('cyclo-club-castaneen');
      expect(params.get('clubId')).toBe('42');
      expect(m.details.upsertLink).not.toHaveBeenCalled();
    });

    it('club sans slug : confirmation sans association précédente', async () => {
      const m = makeController();
      m.clubs.findById.mockResolvedValueOnce({ id: 42, helloAssoSlug: null });

      const params = await redirectOf(m.controller);

      expect(params.get('originClubHasSlug')).toBe('false');
      expect(params.has('clubSlug')).toBe(false);
    });

    it('enregistre la nouvelle chaîne si l’orga est déjà liée (HelloAsso a révoqué l’ancienne)', async () => {
      const m = makeController();
      m.clubs.findById.mockResolvedValueOnce({ id: 42, helloAssoSlug: null });

      await redirectOf(m.controller);

      expect(m.details.saveChainIfOrganizationKnown).toHaveBeenCalledWith({
        organizationSlug: 'velo-club-roquettois',
        accessToken: 'AT',
        refreshToken: 'RT',
        expiresInSeconds: 1800,
      });
    });

    it('un échec de cet enregistrement n’empêche pas la confirmation', async () => {
      const m = makeController();
      m.clubs.findById.mockResolvedValueOnce({ id: 42, helloAssoSlug: null });
      m.details.saveChainIfOrganizationKnown.mockRejectedValueOnce(new Error('db down'));

      expect(await reasonOf(m.controller)).toBe('no_matching_club');
    });

    it('club déjà lié à une autre association : signalé, la webapp n’offre pas la confirmation', async () => {
      const m = makeController();
      m.clubs.findById.mockResolvedValueOnce({ id: 42, helloAssoSlug: 'cyclo-club-castaneen' });
      m.details.findByClubId.mockResolvedValueOnce({ clubId: 42 });

      const params = await redirectOf(m.controller);

      expect(params.get('clubLinked')).toBe('true');
    });

    it('club non lié : pas de drapeau clubLinked', async () => {
      const m = makeController();
      m.clubs.findById.mockResolvedValueOnce({ id: 42, helloAssoSlug: null });

      expect((await redirectOf(m.controller)).has('clubLinked')).toBe(false);
    });
  });
});
