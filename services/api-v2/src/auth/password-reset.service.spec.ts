import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';

import { MailMessage, MailService } from '../common/mail';
import { UserEntity } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { PasswordResetService } from './password-reset.service';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

interface InsertedToken {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}
type UpdateSet = { usedAt?: Date; password?: string };

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let tokenRepository: jest.Mocked<Repository<PasswordResetTokenEntity>>;
  let authService: { findByLoginEmailWithPassword: jest.Mock };
  let mailService: { send: jest.Mock<Promise<void>, [MailMessage]> };
  let manager: {
    update: jest.Mock<Promise<{ affected: number }>, [unknown, unknown, UpdateSet]>;
    insert: jest.Mock<Promise<unknown>, [unknown, InsertedToken]>;
  };
  let dataSource: { transaction: jest.Mock };

  const user = (overrides: Partial<UserEntity> = {}) =>
    ({
      id: 42,
      email: 'jeanne@example.com',
      firstName: 'Jeanne',
      password: 'hash-bcrypt-existant',
      ...overrides,
    }) as UserEntity;

  beforeEach(async () => {
    authService = { findByLoginEmailWithPassword: jest.fn() };
    mailService = { send: jest.fn<Promise<void>, [MailMessage]>().mockResolvedValue(undefined) };
    manager = {
      update: jest
        .fn<Promise<{ affected: number }>, [unknown, unknown, UpdateSet]>()
        .mockResolvedValue({ affected: 1 }),
      insert: jest.fn<Promise<unknown>, [unknown, InsertedToken]>().mockResolvedValue({}),
    };
    dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => Promise<unknown>) => cb(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: { exists: jest.fn().mockResolvedValue(false), findOne: jest.fn() },
        },
        { provide: DataSource, useValue: dataSource },
        { provide: AuthService, useValue: authService },
        { provide: MailService, useValue: mailService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'WEBAPP_PUBLIC_URL' ? 'https://bo.example/' : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get(PasswordResetService);
    tokenRepository = module.get(getRepositoryToken(PasswordResetTokenEntity));
  });

  describe('requestReset', () => {
    it('user inconnu : ni envoi ni exception', async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(null);
      await expect(service.requestReset('inconnu@example.com')).resolves.toBeUndefined();
      expect(mailService.send).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('user sans mot de passe (compte Firebase) : pas d’envoi', async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(user({ password: null as never }));
      await service.requestReset('jeanne@example.com');
      expect(mailService.send).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('cooldown : un token récent non utilisé existe → pas d’envoi', async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(user());
      tokenRepository.exists.mockResolvedValue(true);
      await service.requestReset('jeanne@example.com');
      expect(mailService.send).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('user valide : invalide les anciens tokens, stocke le hash et envoie le lien', async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(user());
      await service.requestReset('jeanne@example.com');

      expect(authService.findByLoginEmailWithPassword).toHaveBeenCalledWith('jeanne@example.com');
      expect(mailService.send).toHaveBeenCalledTimes(1);
      const message = mailService.send.mock.calls[0][0];
      expect(message.to).toBe('jeanne@example.com');

      // Slash final de WEBAPP_PUBLIC_URL retiré.
      // Token en fragment : jamais transmis au serveur (logs nginx, Referer).
      const match = /^https:\/\/bo\.example\/reset-password#token=([A-Za-z0-9_-]+)$/.exec(
        message.debugLink ?? '',
      );
      expect(match).not.toBeNull();
      const token = match![1];
      expect(message.html).toContain(match![0]);
      expect(message.text).toContain(match![0]);

      // Invalidation des tokens non utilisés, puis insertion du hash seul.
      const [, invalidateWhere, invalidateSet] = manager.update.mock.calls[0];
      expect(invalidateWhere).toEqual({ userId: 42, usedAt: IsNull() });
      expect(invalidateSet.usedAt).toBeInstanceOf(Date);

      const inserted = manager.insert.mock.calls[0][1];
      expect(inserted.userId).toBe(42);
      expect(inserted.tokenHash).not.toBe(token);
      expect(inserted.tokenHash).toBe(sha256(token));
      // Dates fournies par Node : createdAt explicite, expiration à +1 h.
      expect(inserted.createdAt).toBeInstanceOf(Date);
      expect(inserted.expiresAt.getTime() - inserted.createdAt.getTime()).toBe(60 * 60 * 1000);
      expect(invalidateSet.usedAt).toEqual(inserted.createdAt);
    });

    it('échec d’envoi : la promesse est rejetée (logée par le contrôleur)', async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(user());
      mailService.send.mockRejectedValue(new Error('Brevo indisponible'));
      await expect(service.requestReset('jeanne@example.com')).rejects.toThrow(
        'Brevo indisponible',
      );
    });

    it('demande concurrente (23505 sur l’index du token actif) : sortie silencieuse, pas d’envoi', async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(user());
      manager.insert.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate key'), {
            code: '23505',
            constraint: 'UQ_password_reset_token_active_user',
          }),
        ),
      );
      await expect(service.requestReset('jeanne@example.com')).resolves.toBeUndefined();
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('autre erreur base : la promesse est rejetée, pas d’envoi', async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(user());
      manager.insert.mockRejectedValue(
        new QueryFailedError('INSERT', [], Object.assign(new Error('boom'), { code: '57014' })),
      );
      await expect(service.requestReset('jeanne@example.com')).rejects.toThrow('boom');
      expect(mailService.send).not.toHaveBeenCalled();
    });
  });

  describe('WEBAPP_PUBLIC_URL invalide', () => {
    let errorSpy: jest.SpyInstance;
    let degraded: PasswordResetService;

    beforeEach(() => {
      errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      const configService = {
        get: jest.fn((key: string) =>
          key === 'WEBAPP_PUBLIC_URL' ? 'https://bo.example/app' : undefined,
        ),
      } as unknown as ConfigService;
      degraded = new PasswordResetService(
        tokenRepository,
        dataSource as unknown as DataSource,
        authService as unknown as AuthService,
        mailService as unknown as MailService,
        configService,
      );
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it("démarre sans throw et logue l'erreur au boot", () => {
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const logged = String((errorSpy.mock.calls as unknown[][])[0][0]);
      expect(logged).toContain('WEBAPP_PUBLIC_URL invalide');
      expect(logged).toContain('la réinitialisation de mot de passe est désactivée');
    });

    it("requestReset : aucun token, aucun envoi, erreur sans l'email, sortie silencieuse", async () => {
      authService.findByLoginEmailWithPassword.mockResolvedValue(user());
      errorSpy.mockClear();

      await expect(degraded.requestReset('jeanne@example.com')).resolves.toBeUndefined();

      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(manager.insert).not.toHaveBeenCalled();
      expect(mailService.send).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(String((errorSpy.mock.calls as unknown[][])[0][0])).not.toContain(
        'jeanne@example.com',
      );
    });

    it('resetPassword : un token existant reste utilisable', async () => {
      tokenRepository.findOne.mockResolvedValue({ id: 7, userId: 42 } as PasswordResetTokenEntity);
      await expect(degraded.resetPassword('mon-token', 'nouveau-mdp')).resolves.toBeUndefined();
      expect(manager.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetPassword', () => {
    it('token inconnu, utilisé ou expiré → BadRequestException', async () => {
      tokenRepository.findOne.mockResolvedValue(null);
      await expect(service.resetPassword('inconnu', 'nouveau-mdp')).rejects.toThrow(
        new BadRequestException('Lien invalide ou expiré'),
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('cherche par hash, non utilisé et non expiré', async () => {
      tokenRepository.findOne.mockResolvedValue(null);
      await service.resetPassword('mon-token', 'nouveau-mdp').catch(() => undefined);
      const where = tokenRepository.findOne.mock.calls[0][0].where as Record<string, unknown>;
      expect(where.tokenHash).toBe(sha256('mon-token'));
      expect(where.usedAt).toEqual(IsNull());
      expect(where.expiresAt).toBeDefined();
    });

    it('token valide : consomme le token puis met à jour le hash du user', async () => {
      tokenRepository.findOne.mockResolvedValue({ id: 7, userId: 42 } as PasswordResetTokenEntity);
      await service.resetPassword('mon-token', 'nouveau-mdp');

      const [, consumeWhere, consumeSet] = manager.update.mock.calls[0];
      expect(consumeWhere).toEqual({ id: 7, usedAt: IsNull() });
      expect(consumeSet.usedAt).toBeInstanceOf(Date);

      const [entity, userId, userSet] = manager.update.mock.calls[1];
      expect(entity).toBe(UserEntity);
      expect(userId).toBe(42);
      expect(bcrypt.compareSync('nouveau-mdp', userSet.password ?? '')).toBe(true);
    });

    it('double soumission concurrente (affected = 0) → BadRequestException, user intact', async () => {
      tokenRepository.findOne.mockResolvedValue({ id: 7, userId: 42 } as PasswordResetTokenEntity);
      manager.update.mockResolvedValueOnce({ affected: 0 });
      await expect(service.resetPassword('mon-token', 'nouveau-mdp')).rejects.toThrow(
        new BadRequestException('Lien invalide ou expiré'),
      );
      expect(manager.update).toHaveBeenCalledTimes(1);
    });
  });
});
