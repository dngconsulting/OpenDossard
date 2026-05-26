import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';
import { HelloAssoApiClient } from './helloasso-api.client';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsEntity } from './entities/helloasso-details.entity';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import { HelloAssoPaymentService } from './helloasso-payment.service';

function makeDto(overrides: Partial<CreateCheckoutIntentDto> = {}): CreateCheckoutIntentDto {
  return {
    competitionId: 32,
    tarifName: 'Adulte',
    licenceNumber: '12345',
    payerProfile: { firstName: 'Sami', lastName: 'Jaber', email: 'sami@example.com' },
    ...overrides,
  };
}

interface QueryBuilderMock {
  leftJoinAndMapOne: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
}

function makeQueryBuilderMock(getManyResult: unknown[] = []): QueryBuilderMock {
  const qb: QueryBuilderMock = {
    leftJoinAndMapOne: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(getManyResult),
  };
  return qb;
}

interface Mocks {
  service: HelloAssoPaymentService;
  paymentRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  competitionRepo: { findOne: jest.Mock };
  licenceRepo: { findOne: jest.Mock };
  userRepo: { findOne: jest.Mock };
  details: {
    findByClubId: jest.Mock;
  };
  oauth: { getPartnerAccessToken: jest.Mock };
  api: { createCheckoutIntent: jest.Mock; getCheckoutIntent: jest.Mock };
}

function makeService(): Mocks {
  const paymentRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x: Partial<HelloAssoPaymentEntity>) => x as HelloAssoPaymentEntity),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const competitionRepo = { findOne: jest.fn() };
  const licenceRepo = { findOne: jest.fn() };
  const userRepo = { findOne: jest.fn() };
  const details = {
    findByClubId: jest.fn(),
  };
  // Les checkouts utilisent le token PARTENAIRE (client_credentials), pas le token club.
  const oauth = { getPartnerAccessToken: jest.fn().mockResolvedValue('partner-tok') };
  const api = { createCheckoutIntent: jest.fn(), getCheckoutIntent: jest.fn() };
  const config = {
    apiBaseUrl: 'https://api.helloasso-sandbox.com',
    paymentReturnUrlSuccess: 'dossardeur://payment/success',
    paymentReturnUrlError: 'dossardeur://payment/error',
    paymentReturnUrlCancelled: 'dossardeur://payment/cancelled',
  } as unknown as HelloAssoConfig;

  const service = new HelloAssoPaymentService(
    paymentRepo as unknown as Repository<HelloAssoPaymentEntity>,
    competitionRepo as unknown as Repository<CompetitionEntity>,
    licenceRepo as unknown as Repository<LicenceEntity>,
    userRepo as unknown as Repository<UserEntity>,
    details as unknown as HelloAssoDetailsService,
    api as unknown as HelloAssoApiClient,
    oauth as unknown as HelloAssoOAuthService,
    config,
  );

  return { service, paymentRepo, competitionRepo, licenceRepo, userRepo, details, oauth, api };
}

function competitionFixture(overrides: Partial<CompetitionEntity> = {}): CompetitionEntity {
  return {
    id: 32,
    name: 'Critérium FSGT Castanet',
    clubId: 782,
    onlineRegistrationEnabled: true,
    pricing: [
      { name: 'Adulte', tarif: 10 },
      { name: 'Jeune', tarif: 5 },
    ],
    ...overrides,
  } as CompetitionEntity;
}

function detailsFixture(): HelloAssoDetailsEntity {
  return { id: 1, clubId: 782, organizationSlug: 'cyclo-club-castaneen' } as HelloAssoDetailsEntity;
}

function userFixture(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 55,
    email: 'sami@example.com',
    firebaseUid: 'fb-uid-abc',
    ...overrides,
  } as UserEntity;
}

function licenceFixture(overrides: Partial<LicenceEntity> = {}): LicenceEntity {
  return {
    id: 1234,
    licenceNumber: '12345',
    firstName: 'Sami',
    name: 'Jaber',
    ...overrides,
  } as LicenceEntity;
}

describe('HelloAssoPaymentService', () => {
  describe('createCheckoutIntent', () => {
    it('throws NotFoundException if competition does not exist', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(null);

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntity if online registration disabled', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(
        competitionFixture({ onlineRegistrationEnabled: false }),
      );

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws UnprocessableEntity if club is not linked to HelloAsso', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(null);

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws NotFoundException if tarifName not in pricing', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(detailsFixture());

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto({ tarifName: 'Inconnu' }), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('accepts tarif as string fr-FR ("12,50") and converts to cents', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      const competition = competitionFixture();
      competition.pricing = [{ name: 'Adulte', tarif: '12,50' }];
      m.competitionRepo.findOne.mockResolvedValue(competition);
      m.details.findByClubId.mockResolvedValue(detailsFixture());
      m.licenceRepo.findOne.mockResolvedValue(licenceFixture());
      m.paymentRepo.findOne.mockResolvedValue(null);
      m.paymentRepo.save.mockResolvedValue({ id: 42, amountCents: 1250 } as HelloAssoPaymentEntity);
      m.api.createCheckoutIntent.mockResolvedValue({ id: 1, redirectUrl: 'https://x' });

      await m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 });

      expect(m.paymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: 1250 }),
      );
      expect(m.api.createCheckoutIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ totalAmount: 1250, initialAmount: 1250 }),
        }),
      );
    });

    it('throws UnprocessableEntity if tarif not numeric (online payment enabled)', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      const competition = competitionFixture();
      competition.pricing = [{ name: 'Adulte', tarif: '10€ sur place' }]; // non parsable
      m.competitionRepo.findOne.mockResolvedValue(competition);
      m.details.findByClubId.mockResolvedValue(detailsFixture());

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws NotFoundException if licence does not exist', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(detailsFixture());
      m.licenceRepo.findOne.mockResolvedValue(null);

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException if an active payment already exists (pending or paid)', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(detailsFixture());
      m.licenceRepo.findOne.mockResolvedValue(licenceFixture());
      m.paymentRepo.findOne.mockResolvedValue({
        id: 999,
        status: HelloAssoPaymentStatus.PENDING,
      } as HelloAssoPaymentEntity);

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('happy path: inserts pending payment, calls HelloAsso, updates intent_id, returns {paymentId, redirectUrl}', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(detailsFixture());
      m.licenceRepo.findOne.mockResolvedValue(licenceFixture());
      m.paymentRepo.findOne.mockResolvedValue(null);
      m.paymentRepo.save.mockResolvedValue({
        id: 42,
        competitionId: 32,
        licenceId: 1234,
        payerUserId: 55,
        amountCents: 1000,
      } as HelloAssoPaymentEntity);
      m.api.createCheckoutIntent.mockResolvedValue({
        id: 90001,
        redirectUrl: 'https://helloasso-sandbox.com/pay/X',
      });

      const result = await m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 });

      expect(result).toEqual({ paymentId: 42, redirectUrl: 'https://helloasso-sandbox.com/pay/X' });

      // Vérifie l'INSERT pending
      expect(m.paymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          competitionId: 32,
          licenceId: 1234,
          payerUserId: 55,
          payerFirebaseUid: 'fb-uid-abc',
          status: HelloAssoPaymentStatus.PENDING,
          tarifId: 'Adulte',
          amountCents: 1000,
          helloAssoCheckoutIntentId: null,
        }),
      );

      // Vérifie metadata HelloAsso
      expect(m.api.createCheckoutIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationSlug: 'cyclo-club-castaneen',
          accessToken: 'partner-tok',
          body: expect.objectContaining({
            totalAmount: 1000,
            initialAmount: 1000,
            containsDonation: false,
            // Les URLs de retour portent le paymentId (helper appendPaymentId) pour
            // que le mobile/SPA retrouve le paiement au retour du deep link.
            backUrl: 'dossardeur://payment/cancelled?paymentId=42',
            errorUrl: 'dossardeur://payment/error?paymentId=42',
            returnUrl: 'dossardeur://payment/success?paymentId=42',
            payer: { firstName: 'Sami', lastName: 'Jaber', email: 'sami@example.com' },
            metadata: {
              openDossardPaymentId: 42,
              competitionId: 32,
              competitionName: 'Critérium FSGT Castanet',
              licenceId: 1234,
              licenceNumber: '12345',
              tarifName: 'Adulte',
            },
          }),
        }),
      );

      // UPDATE intent_id
      expect(m.paymentRepo.update).toHaveBeenCalledWith(42, {
        helloAssoCheckoutIntentId: '90001',
      });
    });

    it('rolls back the pending payment if HelloAsso call fails', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(detailsFixture());
      m.licenceRepo.findOne.mockResolvedValue(licenceFixture());
      m.paymentRepo.findOne.mockResolvedValue(null);
      m.paymentRepo.save.mockResolvedValue({ id: 99 } as HelloAssoPaymentEntity);
      m.api.createCheckoutIntent.mockRejectedValue(new BadGatewayException('HelloAsso down'));

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto(), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(BadGatewayException);

      expect(m.paymentRepo.delete).toHaveBeenCalledWith(99);
      expect(m.paymentRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('refreshStatusFromHelloAsso', () => {
    it('reads the checkout intent with the PARTNER token (not the club token)', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue({
        id: 42,
        competitionId: 32,
        status: HelloAssoPaymentStatus.PENDING,
        paidAt: null,
        helloAssoCheckoutIntentId: 'intent-abc',
      } as HelloAssoPaymentEntity);
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(detailsFixture());
      // Aucun paiement terminal côté HelloAsso → cas "still_pending" (pas de transition)
      m.api.getCheckoutIntent.mockResolvedValue({ order: { payments: [] } });

      const result = await m.service.refreshStatusFromHelloAsso(42);

      expect(m.oauth.getPartnerAccessToken).toHaveBeenCalledTimes(1);
      expect(m.api.getCheckoutIntent).toHaveBeenCalledWith({
        organizationSlug: 'cyclo-club-castaneen',
        accessToken: 'partner-tok',
        checkoutIntentId: 'intent-abc',
      });
      expect(result).toMatchObject({
        id: 42,
        status: HelloAssoPaymentStatus.PENDING,
        outcome: 'still_pending',
      });
    });
  });

  describe('findByIdForOwner', () => {
    it('throws NotFoundException if payment does not exist', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(null);

      await expect(m.service.findByIdForOwner(42, 55)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException if caller is not the payer', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue({
        id: 42,
        payerUserId: 99,
      } as HelloAssoPaymentEntity);

      await expect(m.service.findByIdForOwner(42, 55)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns DTO when caller is the payer', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue({
        id: 42,
        payerUserId: 55,
        status: HelloAssoPaymentStatus.PAID,
        competitionId: 32,
        licenceId: 1234,
        tarifId: 'Adulte',
        amountCents: 1000,
        paidAt: new Date('2026-05-12T10:00:00Z'),
        createdAt: new Date('2026-05-12T09:00:00Z'),
      } as HelloAssoPaymentEntity);

      const result = await m.service.findByIdForOwner(42, 55);

      expect(result).toEqual({
        id: 42,
        status: HelloAssoPaymentStatus.PAID,
        competitionId: 32,
        licenceId: 1234,
        tarifName: 'Adulte',
        montant: 10,
        paidAt: '2026-05-12T10:00:00.000Z',
        createdAt: '2026-05-12T09:00:00.000Z',
      });
    });
  });

  describe('listForOwner', () => {
    it('returns an empty array when the user has no payment', async () => {
      const m = makeService();
      const qb = makeQueryBuilderMock([]);
      m.paymentRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await m.service.listForOwner(55);

      expect(result).toEqual([]);
      expect(qb.orderBy).toHaveBeenCalledWith('payment.createdAt', 'DESC');
    });

    it('maps payments to DTO including competition + licence fields from the JOINs', async () => {
      const m = makeService();
      const qb = makeQueryBuilderMock([
        {
          id: 42,
          payerUserId: 55,
          status: HelloAssoPaymentStatus.PAID,
          competitionId: 32,
          licenceId: 1234,
          tarifId: 'Adulte',
          amountCents: 1000,
          paidAt: new Date('2026-05-12T10:00:00Z'),
          createdAt: new Date('2026-05-12T09:00:00Z'),
          competition: {
            id: 32,
            name: 'Grand Prix Castanet',
            eventDate: new Date('2026-06-15T00:00:00Z'),
            fede: 'FSGT',
          },
          licence: {
            id: 1234,
            firstName: 'Sami',
            // `LicenceEntity.name` est le lastName dans le schéma OpenDossard.
            name: 'Jaber',
          },
        } as HelloAssoPaymentEntity & {
          competition: CompetitionEntity;
          licence: LicenceEntity;
        },
      ]);
      m.paymentRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await m.service.listForOwner(55);

      expect(result).toEqual([
        {
          id: 42,
          status: HelloAssoPaymentStatus.PAID,
          competitionId: 32,
          competitionName: 'Grand Prix Castanet',
          competitionDate: '2026-06-15T00:00:00.000Z',
          competitionFede: 'FSGT',
          licenceId: 1234,
          licenceFirstName: 'Sami',
          licenceLastName: 'Jaber',
          tarifName: 'Adulte',
          montant: 10,
          paidAt: '2026-05-12T10:00:00.000Z',
          createdAt: '2026-05-12T09:00:00.000Z',
        },
      ]);
    });

    it('applies optional competitionId filter when provided', async () => {
      const m = makeService();
      const qb = makeQueryBuilderMock([]);
      m.paymentRepo.createQueryBuilder.mockReturnValue(qb);

      await m.service.listForOwner(55, { competitionId: 32 });

      expect(qb.andWhere).toHaveBeenCalledWith('payment.competitionId = :competitionId', {
        competitionId: 32,
      });
    });

    it('applies optional status filter when provided', async () => {
      const m = makeService();
      const qb = makeQueryBuilderMock([]);
      m.paymentRepo.createQueryBuilder.mockReturnValue(qb);

      await m.service.listForOwner(55, { status: HelloAssoPaymentStatus.PAID });

      expect(qb.andWhere).toHaveBeenCalledWith('payment.status = :status', {
        status: HelloAssoPaymentStatus.PAID,
      });
    });

    it('does NOT add filter clauses when no filter is provided', async () => {
      const m = makeService();
      const qb = makeQueryBuilderMock([]);
      m.paymentRepo.createQueryBuilder.mockReturnValue(qb);

      await m.service.listForOwner(55);

      // Aucun andWhere appelé : seul le where initial (payerUserId) est posé
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    /**
     * **Broken Access Control safeguard** : ce test est CRITIQUE.
     * Il garantit que la clause WHERE filtre TOUJOURS par `payerUserId` issu
     * du caller (qui doit lui-même venir de `@CurrentUser('id')` côté
     * controller — cf. doc bloc class). Si cette clause sautait, n'importe
     * quel user authentifié pourrait lire les paiements d'autres users.
     */
    it('Broken Access Control: WHERE always scopes by payerUserId (no leak across users)', async () => {
      const m = makeService();
      const qb = makeQueryBuilderMock([]);
      m.paymentRepo.createQueryBuilder.mockReturnValue(qb);

      await m.service.listForOwner(999);

      expect(qb.where).toHaveBeenCalledTimes(1);
      expect(qb.where).toHaveBeenCalledWith('payment.payerUserId = :payerUserId', {
        payerUserId: 999,
      });

      // Vérifie aussi que la clause where utilise bien le param `payerUserId`
      // (pas un autre nom) — défensif contre un refacto qui casserait le scope.
      const whereCall = qb.where.mock.calls[0];
      expect(String(whereCall[0])).toContain('payerUserId');
    });
  });
});
