/* eslint-disable @typescript-eslint/unbound-method -- assertions sur mocks Jest (pattern standard du repo) */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserClubEntity } from './entities/user-club.entity';
import { UserClubService } from './user-club.service';

describe('UserClubService', () => {
  let service: UserClubService;
  let repo: jest.Mocked<Repository<UserClubEntity>>;
  let qbExecute: jest.Mock;

  const link = (userId: number, clubId: number): UserClubEntity => ({
    userId,
    clubId,
    createdAt: new Date(),
  });

  beforeEach(async () => {
    qbExecute = jest.fn().mockResolvedValue({ affected: 0 });
    const mockQB = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: qbExecute,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserClubService,
        {
          provide: getRepositoryToken(UserClubEntity),
          useValue: {
            find: jest.fn(),
            insert: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQB),
          },
        },
      ],
    }).compile();

    service = module.get(UserClubService);
    repo = module.get(getRepositoryToken(UserClubEntity));
  });

  describe('findClubIdsForUser', () => {
    it('retourne les clubIds triés par clubId ASC', async () => {
      repo.find.mockResolvedValue([link(1, 12), link(1, 45)]);
      await expect(service.findClubIdsForUser(1)).resolves.toEqual([12, 45]);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { clubId: 'ASC' },
      });
    });

    it('retourne [] si aucun lien', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.findClubIdsForUser(99)).resolves.toEqual([]);
    });
  });

  describe('setClubIdsForUser', () => {
    it('ajoute seulement (existing=[], target=[1,2])', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.setClubIdsForUser(1, [1, 2]);
      expect(result.added).toEqual([1, 2]);
      expect(result.removed).toEqual([]);
      expect(result.kept).toEqual([]);
      expect(repo.insert).toHaveBeenCalledWith([
        { userId: 1, clubId: 1 },
        { userId: 1, clubId: 2 },
      ]);
      expect(qbExecute).not.toHaveBeenCalled();
    });

    it('retire seulement (existing=[1,2], target=[])', async () => {
      repo.find.mockResolvedValue([link(1, 1), link(1, 2)]);
      const result = await service.setClubIdsForUser(1, []);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([1, 2]);
      expect(result.kept).toEqual([]);
      expect(repo.insert).not.toHaveBeenCalled();
      expect(qbExecute).toHaveBeenCalled();
    });

    it('idempotent (existing=[1,2], target=[1,2])', async () => {
      repo.find.mockResolvedValue([link(1, 1), link(1, 2)]);
      const result = await service.setClubIdsForUser(1, [1, 2]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
      expect(result.kept).toEqual([1, 2]);
      expect(repo.insert).not.toHaveBeenCalled();
      expect(qbExecute).not.toHaveBeenCalled();
    });

    it('mix ajout+retrait (existing=[1,2,3], target=[2,3,4])', async () => {
      repo.find.mockResolvedValue([link(1, 1), link(1, 2), link(1, 3)]);
      const result = await service.setClubIdsForUser(1, [2, 3, 4]);
      expect(result.added).toEqual([4]);
      expect(result.removed).toEqual([1]);
      expect(result.kept).toEqual([2, 3]);
      expect(repo.insert).toHaveBeenCalledWith([{ userId: 1, clubId: 4 }]);
    });

    it('dédoublonne les targets en doublon (existing=[], target=[1,1,2])', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.setClubIdsForUser(1, [1, 1, 2]);
      expect(result.added).toEqual([1, 2]);
      expect(repo.insert).toHaveBeenCalledWith([
        { userId: 1, clubId: 1 },
        { userId: 1, clubId: 2 },
      ]);
    });
  });
});
