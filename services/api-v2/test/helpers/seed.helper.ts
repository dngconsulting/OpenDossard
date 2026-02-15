import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

import { ClubEntity } from '../../src/clubs/entities/club.entity';
import { Federation } from '../../src/common/enums';
import { UserEntity } from '../../src/users/entities/user.entity';

const TEST_PASSWORD_HASH = bcrypt.hashSync('testpass123', 10);

export class SeedHelper {
  private dataSource: DataSource;

  constructor(app: INestApplication) {
    this.dataSource = app.get(DataSource);
  }

  /** Crée les 3 utilisateurs de test (ADMIN, ORGANISATEUR, MOBILE) */
  async seedUsers(): Promise<void> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    await userRepo.save([
      userRepo.create({
        id: 1,
        email: 'admin@test.com',
        password: TEST_PASSWORD_HASH,
        firstName: 'Admin',
        lastName: 'Test',
        roles: 'ADMIN',
      }),
      userRepo.create({
        id: 2,
        email: 'orga@test.com',
        password: TEST_PASSWORD_HASH,
        firstName: 'Orga',
        lastName: 'Test',
        roles: 'ORGANISATEUR',
      }),
      userRepo.create({
        id: 3,
        email: 'mobile@test.com',
        password: TEST_PASSWORD_HASH,
        firstName: 'Mobile',
        lastName: 'Test',
        roles: 'MOBILE',
      }),
    ]);
  }

  /** Crée 3 clubs de test et retourne les entités */
  async seedClubs(): Promise<ClubEntity[]> {
    const clubRepo = this.dataSource.getRepository(ClubEntity);
    return clubRepo.save([
      clubRepo.create({
        shortName: 'VCT',
        longName: 'Vélo Club Toulousain',
        dept: '31',
        fede: Federation.FSGT,
        elicenceName: 'VELO CLUB TOULOUSAIN',
      }),
      clubRepo.create({
        shortName: 'CCG',
        longName: 'Cyclo Club Gascon',
        dept: '32',
        fede: Federation.FSGT,
        elicenceName: 'CYCLO CLUB GASCON',
      }),
      clubRepo.create({
        shortName: 'RCB',
        longName: 'Racing Club Bordelais',
        dept: '33',
        fede: Federation.FFC,
        elicenceName: 'RACING CLUB BORDELAIS',
      }),
    ]);
  }

  /** Supprime toutes les données (TRUNCATE CASCADE) */
  async cleanAll(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    for (const entity of entities) {
      const repo = this.dataSource.getRepository(entity.name);
      await repo.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }
  }

  /** Supprime uniquement les clubs */
  async cleanClubs(): Promise<void> {
    await this.dataSource.getRepository(ClubEntity).query('TRUNCATE TABLE "club" CASCADE');
  }
}
