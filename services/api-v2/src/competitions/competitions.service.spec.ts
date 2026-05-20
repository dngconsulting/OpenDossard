/* eslint-disable @typescript-eslint/unbound-method -- assertions sur mocks Jest */
import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { Role } from '../common/enums';
import { HelloAssoPaymentEntity } from '../helloasso/entities/helloasso-payment.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionsService } from './competitions.service';
import { CompetitionEntity } from './entities/competition.entity';

describe('CompetitionsService — scope enforcement (lot 2)', () => {
  let service: CompetitionsService;
  let competitionRepo: jest.Mocked<Repository<CompetitionEntity>>;
  let paymentRepo: jest.Mocked<Repository<HelloAssoPaymentEntity>>;
  let authz: jest.Mocked<AuthorizationService>;

  // Note : on n'utilise pas l'ADMIN ici car la branche ADMIN-bypass est testée
  // dans `auth/authorization.service.spec.ts` (siège de la logique d'autorisation).
  // Ce spec vérifie uniquement le wiring du service vers AuthorizationService.
  const ORGA: AuthenticatedUser = { id: 2, email: 'orga@x', roles: [Role.ORGANISATEUR] };

  const baseCompetition: CompetitionEntity = {
    id: 100,
    clubId: 42,
    name: 'GP de Test',
  } as CompetitionEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitionsService,
        {
          provide: getRepositoryToken(CompetitionEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation((e: CompetitionEntity) => Promise.resolve(e)),
            create: jest
              .fn()
              .mockImplementation((data: Partial<CompetitionEntity>) => ({ id: 100, ...data })),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RaceEntity),
          useValue: { find: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(HelloAssoPaymentEntity),
          useValue: {
            count: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: AuthorizationService,
          useValue: {
            assertClubAccess: jest.fn().mockResolvedValue(undefined),
            assertCompetitionAccess: jest.fn().mockResolvedValue(undefined),
            listAccessibleClubIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CompetitionsService);
    competitionRepo = module.get(getRepositoryToken(CompetitionEntity));
    paymentRepo = module.get(getRepositoryToken(HelloAssoPaymentEntity));
    authz = module.get(AuthorizationService);
  });

  // La logique d'autorisation (ADMIN bypass, clubId null → Forbidden, délégation
  // à assertClubAccess) est testée dans `auth/authorization.service.spec.ts`.
  // Ici, on vérifie uniquement que CompetitionsService délègue correctement à
  // `AuthorizationService.assertCompetitionAccess` aux bons endroits et avec
  // les bons arguments (wiring).

  describe('create', () => {
    it('délègue assertCompetitionAccess avec le clubId fourni', async () => {
      await expect(
        service.create({ clubId: 42, name: 'X' } as Partial<CompetitionEntity>, ORGA),
      ).resolves.toBeDefined();
      expect(authz.assertCompetitionAccess).toHaveBeenCalledWith(ORGA, { id: -1, clubId: 42 });
    });

    it('délègue assertCompetitionAccess avec clubId=null si non fourni', async () => {
      await expect(
        service.create({ name: 'X' } as Partial<CompetitionEntity>, ORGA),
      ).resolves.toBeDefined();
      expect(authz.assertCompetitionAccess).toHaveBeenCalledWith(ORGA, { id: -1, clubId: null });
    });

    it("propage l'exception levée par assertCompetitionAccess", async () => {
      authz.assertCompetitionAccess.mockRejectedValueOnce(new ForbiddenException('nope'));
      await expect(
        service.create({ clubId: 99, name: 'X' } as Partial<CompetitionEntity>, ORGA),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update — changement de clubId', () => {
    it('double check (club actuel + nouveau club) si clubId change', async () => {
      competitionRepo.findOne.mockResolvedValue({ ...baseCompetition, clubId: 42 });

      await expect(
        service.update(100, { clubId: 99 } as Partial<CompetitionEntity>, ORGA),
      ).resolves.toBeDefined();
      expect(authz.assertCompetitionAccess).toHaveBeenCalledTimes(2);
    });

    it('un seul check si clubId inchangé, pas de count payment', async () => {
      competitionRepo.findOne.mockResolvedValue({ ...baseCompetition, clubId: 42 });

      await expect(
        service.update(100, { name: 'New name' } as Partial<CompetitionEntity>, ORGA),
      ).resolves.toBeDefined();
      expect(authz.assertCompetitionAccess).toHaveBeenCalledTimes(1);
      expect(paymentRepo.count).not.toHaveBeenCalled();
    });

    it('rejette 422 si changement clubId avec paiement actif', async () => {
      competitionRepo.findOne.mockResolvedValue({ ...baseCompetition, clubId: 42 });
      paymentRepo.count.mockResolvedValue(3);

      await expect(
        service.update(100, { clubId: 99 } as Partial<CompetitionEntity>, ORGA),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(paymentRepo.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove / duplicate / validate', () => {
    it('remove : délègue assertCompetitionAccess avec la compet fetchée', async () => {
      competitionRepo.findOne.mockResolvedValue(baseCompetition);
      await expect(service.remove(100, ORGA)).resolves.toBeUndefined();
      expect(authz.assertCompetitionAccess).toHaveBeenCalledWith(ORGA, baseCompetition);
    });

    it("duplicate : délègue assertCompetitionAccess avec la compet d'origine", async () => {
      competitionRepo.findOne.mockResolvedValue(baseCompetition);
      await expect(service.duplicate(100, ORGA)).resolves.toBeDefined();
      expect(authz.assertCompetitionAccess).toHaveBeenCalledWith(ORGA, baseCompetition);
    });

    it('validate : délègue assertCompetitionAccess avec la compet fetchée', async () => {
      competitionRepo.findOne.mockResolvedValue(baseCompetition);
      await expect(service.validate(100, ORGA)).resolves.toBeDefined();
      expect(authz.assertCompetitionAccess).toHaveBeenCalledWith(ORGA, baseCompetition);
    });

    it("compet introuvable : NotFound (avant tout check d'autorisation)", async () => {
      competitionRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(999, ORGA)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
