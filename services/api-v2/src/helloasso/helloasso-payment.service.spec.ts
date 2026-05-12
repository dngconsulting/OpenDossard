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
import { HelloAssoPaymentEntity, HelloAssoPaymentStatus } from './entities/helloasso-payment.entity';
import { HelloAssoPaymentService } from './helloasso-payment.service';

function makeDto(overrides: Partial<CreateCheckoutIntentDto> = {}): CreateCheckoutIntentDto {
  return {
    competitionId: 32,
    tarifId: 'adulte',
    licenceNumber: '12345',
    payerProfile: { firstName: 'Sami', lastName: 'Jaber', email: 'sami@example.com' },
    ...overrides,
  };
}

interface Mocks {
  service: HelloAssoPaymentService;
  paymentRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  competitionRepo: { findOne: jest.Mock };
  licenceRepo: { findOne: jest.Mock };
  userRepo: { findOne: jest.Mock };
  details: { findByClubId: jest.Mock; decryptTokens: jest.Mock; withHelloAssoClubAccessToken: jest.Mock };
  api: { createCheckoutIntent: jest.Mock };
}

function makeService(): Mocks {
  const paymentRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x: Partial<HelloAssoPaymentEntity>) => x as HelloAssoPaymentEntity),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const competitionRepo = { findOne: jest.fn() };
  const licenceRepo = { findOne: jest.fn() };
  const userRepo = { findOne: jest.fn() };
  const details = {
    findByClubId: jest.fn(),
    decryptTokens: jest.fn(() => ({ accessToken: 'access-tok', refreshToken: 'refresh-tok' })),
    // Par défaut, withHelloAssoClubAccessToken forwarde le token au callback sans refresh.
    // Les tests qui veulent tester le refresh redéfinissent ce mock localement.
    withHelloAssoClubAccessToken: jest.fn((_clubId: number, fn: (token: string) => Promise<unknown>) =>
      fn('access-tok'),
    ),
  };
  const api = { createCheckoutIntent: jest.fn() };
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
    config,
  );

  return { service, paymentRepo, competitionRepo, licenceRepo, userRepo, details, api };
}

function competitionFixture(overrides: Partial<CompetitionEntity> = {}): CompetitionEntity {
  return {
    id: 32,
    name: 'Critérium FSGT Castanet',
    clubId: 782,
    onlineRegistrationEnabled: true,
    pricing: [
      { name: 'Adulte', tarif: '10€', id: 'adulte', amountCents: 1000 },
      { name: 'Jeune', tarif: '5€', id: 'jeune', amountCents: 500 },
    ],
    ...overrides,
  } as CompetitionEntity;
}

function detailsFixture(): HelloAssoDetailsEntity {
  return { id: 1, clubId: 782, organizationSlug: 'cyclo-club-castaneen' } as HelloAssoDetailsEntity;
}

function userFixture(overrides: Partial<UserEntity> = {}): UserEntity {
  return { id: 55, email: 'sami@example.com', firebaseUid: 'fb-uid-abc', ...overrides } as UserEntity;
}

function licenceFixture(overrides: Partial<LicenceEntity> = {}): LicenceEntity {
  return { id: 1234, licenceNumber: '12345', firstName: 'Sami', name: 'Jaber', ...overrides } as LicenceEntity;
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
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture({ onlineRegistrationEnabled: false }));

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

    it('throws NotFoundException if tarifId not in pricing', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      m.competitionRepo.findOne.mockResolvedValue(competitionFixture());
      m.details.findByClubId.mockResolvedValue(detailsFixture());

      await expect(
        m.service.createCheckoutIntent({ dto: makeDto({ tarifId: 'inconnu' }), payerUserId: 55 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntity if tarif missing amountCents', async () => {
      const m = makeService();
      m.userRepo.findOne.mockResolvedValue(userFixture());
      const competition = competitionFixture();
      competition.pricing = [{ name: 'Adulte', tarif: '10€', id: 'adulte' }]; // no amountCents
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
      m.paymentRepo.findOne.mockResolvedValue({ id: 999, status: HelloAssoPaymentStatus.PENDING } as HelloAssoPaymentEntity);

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
      m.api.createCheckoutIntent.mockResolvedValue({ id: 90001, redirectUrl: 'https://helloasso-sandbox.com/pay/X' });

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
          tarifId: 'adulte',
          tarifLabelSnapshot: 'Adulte',
          amountCents: 1000,
          helloAssoCheckoutIntentId: null,
        }),
      );

      // Vérifie metadata HelloAsso
      expect(m.api.createCheckoutIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationSlug: 'cyclo-club-castaneen',
          accessToken: 'access-tok',
          body: expect.objectContaining({
            totalAmount: 1000,
            initialAmount: 1000,
            containsDonation: false,
            backUrl: 'dossardeur://payment/cancelled',
            errorUrl: 'dossardeur://payment/error',
            returnUrl: 'dossardeur://payment/success',
            payer: { firstName: 'Sami', lastName: 'Jaber', email: 'sami@example.com' },
            metadata: {
              openDossardPaymentId: 42,
              competitionId: 32,
              competitionName: 'Critérium FSGT Castanet',
              licenceId: 1234,
              licenceNumber: '12345',
              tarifId: 'adulte',
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

  describe('findByIdForOwner', () => {
    it('throws NotFoundException if payment does not exist', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(null);

      await expect(m.service.findByIdForOwner(42, 55)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException if caller is not the payer', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue({ id: 42, payerUserId: 99 } as HelloAssoPaymentEntity);

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
        tarifId: 'adulte',
        tarifLabelSnapshot: 'Adulte',
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
        tarifId: 'adulte',
        tarifLabelSnapshot: 'Adulte',
        amountCents: 1000,
        paidAt: '2026-05-12T10:00:00.000Z',
        createdAt: '2026-05-12T09:00:00.000Z',
      });
    });
  });
});
