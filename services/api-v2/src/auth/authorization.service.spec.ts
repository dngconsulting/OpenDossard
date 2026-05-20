/* eslint-disable @typescript-eslint/unbound-method -- assertions sur les méthodes mockées Jest (pattern standard du repo, cf. autres *.spec.ts) */
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClubEntity } from '../clubs/entities/club.entity';
import { Role } from '../common/enums';
import { AuthorizationService } from './authorization.service';
import { UserClubEntity } from './entities/user-club.entity';
import { AuthenticatedUser } from './types/authenticated-user';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let repo: jest.Mocked<Repository<UserClubEntity>>;
  let clubRepo: jest.Mocked<Repository<ClubEntity>>;

  const ADMIN_USER: AuthenticatedUser = { id: 1, email: 'admin@x', roles: [Role.ADMIN] };
  const ORGA_USER: AuthenticatedUser = { id: 2, email: 'orga@x', roles: [Role.ORGANISATEUR] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        {
          provide: getRepositoryToken(UserClubEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClubEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get(AuthorizationService);
    repo = module.get(getRepositoryToken(UserClubEntity));
    clubRepo = module.get(getRepositoryToken(ClubEntity));
  });

  describe('assertClubAccess', () => {
    it('passe sans query pour un ADMIN', async () => {
      await expect(service.assertClubAccess(ADMIN_USER, 42)).resolves.toBeUndefined();
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('passe pour un ORGANISATEUR lié au club', async () => {
      repo.findOne.mockResolvedValue({ userId: 2, clubId: 42, createdAt: new Date() });
      await expect(service.assertClubAccess(ORGA_USER, 42)).resolves.toBeUndefined();
      expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 2, clubId: 42 } });
    });

    it('throw Forbidden pour un ORGANISATEUR non lié au club', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.assertClubAccess(ORGA_USER, 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('inclut le longName du club dans le message pour un toast lisible', async () => {
      repo.findOne.mockResolvedValue(null);
      clubRepo.findOne.mockResolvedValueOnce({
        id: 42,
        longName: 'SUNDGAU SPORT ORGANISATION',
      } as ClubEntity);
      await expect(service.assertClubAccess(ORGA_USER, 42)).rejects.toThrow(
        /SUNDGAU SPORT ORGANISATION/,
      );
    });

    it("retombe sur l'ID si le club est introuvable (fallback)", async () => {
      repo.findOne.mockResolvedValue(null);
      clubRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.assertClubAccess(ORGA_USER, 999)).rejects.toThrow(/#999/);
    });

    it("throw Forbidden pour un club inexistant (même comportement, pas de leak d'info)", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.assertClubAccess(ORGA_USER, 999_999)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('passe pour un user combinant ADMIN + ORGANISATEUR (ADMIN gagne)', async () => {
      const mixed: AuthenticatedUser = {
        id: 3,
        email: 'x',
        roles: [Role.ADMIN, Role.ORGANISATEUR],
      };
      await expect(service.assertClubAccess(mixed, 1)).resolves.toBeUndefined();
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('assertCompetitionAccess', () => {
    it('passe sans query pour un ADMIN, même si clubId null', async () => {
      await expect(
        service.assertCompetitionAccess(ADMIN_USER, { id: 1, clubId: null }),
      ).resolves.toBeUndefined();
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it("throw Forbidden pour un ORGANISATEUR si la compétition n'a pas de clubId", async () => {
      await expect(
        service.assertCompetitionAccess(ORGA_USER, { id: 1, clubId: null }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('throw Forbidden pour un ORGANISATEUR si la compétition a un clubId undefined', async () => {
      await expect(
        service.assertCompetitionAccess(ORGA_USER, { id: 1, clubId: undefined }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('délègue à assertClubAccess si clubId présent (passe pour ORGA lié)', async () => {
      repo.findOne.mockResolvedValue({ userId: 2, clubId: 42, createdAt: new Date() });
      await expect(
        service.assertCompetitionAccess(ORGA_USER, { id: 1, clubId: 42 }),
      ).resolves.toBeUndefined();
      expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 2, clubId: 42 } });
    });

    it('délègue à assertClubAccess si clubId présent (Forbidden pour ORGA non lié)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.assertCompetitionAccess(ORGA_USER, { id: 1, clubId: 99 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('listAccessibleClubIds', () => {
    it('retourne "ALL" pour un ADMIN sans query', async () => {
      await expect(service.listAccessibleClubIds(ADMIN_USER)).resolves.toBe('ALL');
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('retourne [] pour un ORGANISATEUR sans aucun lien', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.listAccessibleClubIds(ORGA_USER)).resolves.toEqual([]);
    });

    it('retourne la liste des clubIds pour un ORGANISATEUR multi-club', async () => {
      repo.find.mockResolvedValue([
        { userId: 2, clubId: 12, createdAt: new Date() },
        { userId: 2, clubId: 45, createdAt: new Date() },
        { userId: 2, clubId: 78, createdAt: new Date() },
      ]);
      await expect(service.listAccessibleClubIds(ORGA_USER)).resolves.toEqual([12, 45, 78]);
    });
  });

  describe('getAccessibleClubsScope', () => {
    it("renvoie { scope: 'ALL' } pour un ADMIN (pas de clubIds exposés)", async () => {
      await expect(service.getAccessibleClubsScope(ADMIN_USER)).resolves.toEqual({ scope: 'ALL' });
      expect(repo.find).not.toHaveBeenCalled();
    });

    it("renvoie { scope: 'SCOPED', clubIds: [] } pour un ORGA sans lien", async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.getAccessibleClubsScope(ORGA_USER)).resolves.toEqual({
        scope: 'SCOPED',
        clubIds: [],
      });
    });

    it("renvoie { scope: 'SCOPED', clubIds: [...] } pour un ORGA lié", async () => {
      repo.find.mockResolvedValue([
        { userId: 2, clubId: 10, createdAt: new Date() },
        { userId: 2, clubId: 11, createdAt: new Date() },
      ]);
      await expect(service.getAccessibleClubsScope(ORGA_USER)).resolves.toEqual({
        scope: 'SCOPED',
        clubIds: [10, 11],
      });
    });
  });
});
