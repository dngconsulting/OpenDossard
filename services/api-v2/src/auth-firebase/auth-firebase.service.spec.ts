import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { AuthFirebaseService } from './auth-firebase.service';
import { UserEntity } from '../users/entities/user.entity';
import { HelloAssoPaymentEntity } from '../helloasso/entities/helloasso-payment.entity';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';

const VALID_UID = 'firebase-uid-123';
const VALID_EMAIL = 'user@example.com';

const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity => {
  const u: any = {
    id: 42,
    email: VALID_EMAIL,
    firstName: 'X',
    lastName: 'Y',
    roles: 'MOBILE',
    phone: null,
    firebaseUid: null,
    signInProvider: null,
    password: null,
    ...overrides,
    getRolesArray() {
      return this.roles ? this.roles.split(',') : [];
    },
    hasRole(role: string) {
      return this.getRolesArray().includes(role);
    },
  };
  return u as UserEntity;
};

describe('AuthFirebaseService', () => {
  let service: AuthFirebaseService;
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let verifyIdToken: jest.Mock;
  let deleteUser: jest.Mock;
  let jwtService: { signAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock; get: jest.Mock };

  beforeEach(async () => {
    verifyIdToken = jest.fn();
    deleteUser = jest.fn().mockResolvedValue(undefined);
    const firebaseApp = { auth: () => ({ verifyIdToken, deleteUser }) };

    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
      get: jest.fn().mockImplementation((_key: string, def?: unknown) => def),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthFirebaseService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          // RGPD : deleteAccount anonymise les snapshots de paiement via un
          // query builder UPDATE avant de supprimer le user.
          provide: getRepositoryToken(HelloAssoPaymentEntity),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 0 }),
            })),
          },
        },
        { provide: FIREBASE_ADMIN, useValue: firebaseApp },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthFirebaseService);
    userRepo = module.get(getRepositoryToken(UserEntity));
  });

  describe('exchange()', () => {
    it('returns tokens when token valid and firebase_uid mapped', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      userRepo.findOne.mockResolvedValueOnce(buildUser({ id: 42 }));

      const result = await service.exchange('valid-token');

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.user.id).toBe(42);
      expect(result.user.email).toBe(VALID_EMAIL);
    });

    it('throws UnauthorizedException on invalid signature', async () => {
      verifyIdToken.mockRejectedValueOnce({ code: 'auth/argument-error' });

      await expect(service.exchange('bad-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException on expired token', async () => {
      verifyIdToken.mockRejectedValueOnce({ code: 'auth/id-token-expired' });

      await expect(service.exchange('expired')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws BadRequestException when token has no email', async () => {
      verifyIdToken.mockResolvedValueOnce({ uid: VALID_UID });

      await expect(service.exchange('no-email')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when no backend mapping', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.exchange('valid-token')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('sources email from decoded idToken, not from entity (which can be null)', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      // Entity avec email NULL (cas firebase user) — la réponse + JWT doivent
      // récupérer l'email depuis le idToken vérifié, pas depuis l'entity.
      userRepo.findOne.mockResolvedValueOnce(buildUser({ id: 42, email: null as any }));

      const result = await service.exchange('valid-token');

      expect(result.user.email).toBe(VALID_EMAIL);
      const [payload] = jwtService.signAsync.mock.calls[0];
      expect(payload).toEqual({
        sub: 42,
        email: VALID_EMAIL,
        roles: ['MOBILE'],
      });
    });
  });

  describe('register()', () => {
    const validDto = {
      idToken: 'valid',
      firstName: 'Sami',
      lastName: 'Jaber',
    };

    const setupCreateAndSave = () => {
      userRepo.create.mockImplementation((data: any) =>
        buildUser({ ...data, id: 99 }),
      );
      userRepo.save.mockImplementation(async (u: any) => u);
    };

    it('creates user and returns tokens on first registration', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
        firebase: { sign_in_provider: 'password' },
      });
      userRepo.findOne.mockResolvedValueOnce(null); // lookup by uid only
      setupCreateAndSave();

      const result = await service.register(validDto);

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.id).toBe(99);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firebaseUid: VALID_UID,
          // Email NON persisté pour les firebase users (source = Firebase Auth)
          email: null,
          firstName: 'Sami',
          lastName: 'Jaber',
          roles: 'MOBILE',
          signInProvider: 'password',
        }),
      );
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('does not persist email on the created firebase user', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
        firebase: { sign_in_provider: 'password' },
      });
      userRepo.findOne.mockResolvedValueOnce(null);
      setupCreateAndSave();

      const result = await service.register(validDto);

      // Création : email volontairement null
      const createArg = userRepo.create.mock.calls[0][0] as any;
      expect(createArg.email).toBeNull();

      // Réponse : email présent et sourcé du idToken (pas de l'entity)
      expect(result.user.email).toBe(VALID_EMAIL);
    });

    it('allows registration even if a legacy user already has the same email', async () => {
      // Décision 2026-04-27 : on ne déduplique plus sur l'email entre rows
      // legacy et firebase. Un humain peut avoir 2 rows backend (rôles
      // différents, méthodes d'auth différentes) — c'est intentionnel.
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      userRepo.findOne.mockResolvedValueOnce(null); // lookup by uid → not found
      // (pas de lookup par email — il a été supprimé du flow)
      setupCreateAndSave();

      const result = await service.register(validDto);

      expect(result.accessToken).toBe('signed-token');
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws UnauthorizedException on invalid token', async () => {
      verifyIdToken.mockRejectedValueOnce({ code: 'auth/argument-error' });

      await expect(service.register(validDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(userRepo.create).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when token has no email', async () => {
      verifyIdToken.mockResolvedValueOnce({ uid: VALID_UID });

      await expect(service.register(validDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws ConflictException when firebase_uid already mapped', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      userRepo.findOne.mockResolvedValueOnce(buildUser({ id: 1 })); // uid found

      await expect(service.register(validDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('defaults sign_in_provider to "password" when missing in token', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
        // no firebase.sign_in_provider
      });
      userRepo.findOne.mockResolvedValueOnce(null);
      setupCreateAndSave();

      await service.register(validDto);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ signInProvider: 'password' }),
      );
    });

    it('trims firstName and lastName from DTO', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      userRepo.findOne.mockResolvedValueOnce(null);
      setupCreateAndSave();

      await service.register({
        idToken: 'valid',
        firstName: '  Sami  ',
        lastName: '  Jaber  ',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Sami', lastName: 'Jaber' }),
      );
    });
  });

  describe('JWT generation', () => {
    it('uses JWT_SECRET + JWT_REFRESH_SECRET via getOrThrow (no fallback default)', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      userRepo.findOne.mockResolvedValueOnce(buildUser());

      await service.exchange('valid');

      expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'JWT_REFRESH_SECRET',
      );
    });

    it('payload contains { sub, email, roles } strictly identical to legacy', async () => {
      verifyIdToken.mockResolvedValueOnce({
        uid: VALID_UID,
        email: VALID_EMAIL,
      });
      userRepo.findOne.mockResolvedValueOnce(
        buildUser({ id: 42, roles: 'MOBILE,ORGANIZER' }),
      );

      await service.exchange('valid');

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      const [payload] = jwtService.signAsync.mock.calls[0];
      expect(payload).toEqual({
        sub: 42,
        email: VALID_EMAIL,
        roles: ['MOBILE', 'ORGANIZER'],
      });
    });
  });

  describe('deleteAccount()', () => {
    it('deletes Firebase user then backend row', async () => {
      userRepo.findOne.mockResolvedValueOnce(
        buildUser({ id: 42, firebaseUid: VALID_UID }),
      );

      await service.deleteAccount(42);

      expect(deleteUser).toHaveBeenCalledWith(VALID_UID);
      expect(userRepo.delete).toHaveBeenCalledWith({ id: 42 });
    });

    it('is idempotent when backend user already gone', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.deleteAccount(42)).resolves.toBeUndefined();

      expect(deleteUser).not.toHaveBeenCalled();
      expect(userRepo.delete).not.toHaveBeenCalled();
    });

    it('rejects with 403 when target is a non-firebase (backoffice) user', async () => {
      userRepo.findOne.mockResolvedValueOnce(
        buildUser({ id: 7, firebaseUid: null }),
      );

      await expect(service.deleteAccount(7)).rejects.toThrow(
        ForbiddenException,
      );
      expect(deleteUser).not.toHaveBeenCalled();
      expect(userRepo.delete).not.toHaveBeenCalled();
    });

    it('continues to DB delete when Firebase user is already gone', async () => {
      userRepo.findOne.mockResolvedValueOnce(
        buildUser({ id: 42, firebaseUid: VALID_UID }),
      );
      const fbErr: any = new Error('not found');
      fbErr.code = 'auth/user-not-found';
      deleteUser.mockRejectedValueOnce(fbErr);

      await service.deleteAccount(42);

      expect(userRepo.delete).toHaveBeenCalledWith({ id: 42 });
    });

    it('aborts before DB delete when Firebase delete fails for unknown reason', async () => {
      userRepo.findOne.mockResolvedValueOnce(
        buildUser({ id: 42, firebaseUid: VALID_UID }),
      );
      const fbErr: any = new Error('boom');
      fbErr.code = 'auth/internal-error';
      deleteUser.mockRejectedValueOnce(fbErr);

      await expect(service.deleteAccount(42)).rejects.toThrow('boom');
      expect(userRepo.delete).not.toHaveBeenCalled();
    });
  });
});
