import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

import { ChallengeEntity } from '../../src/challenges/entities/challenge.entity';
import { ClubEntity } from '../../src/clubs/entities/club.entity';
import { CompetitionType, Federation } from '../../src/common/enums';
import { CompetitionEntity } from '../../src/competitions/entities/competition.entity';
import { LicenceEntity } from '../../src/licences/entities/licence.entity';
import { RaceEntity } from '../../src/races/entities/race.entity';
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

  /** Crée 3 licences de test et retourne les entités */
  async seedLicences(): Promise<LicenceEntity[]> {
    const repo = this.dataSource.getRepository(LicenceEntity);
    return repo.save([
      repo.create({
        name: 'DUPONT',
        firstName: 'Jean',
        licenceNumber: '12345678',
        gender: 'H',
        club: 'Vélo Club Toulousain',
        dept: '31',
        birthYear: '1985',
        catea: 'S',
        catev: '2',
        fede: Federation.FSGT,
        saison: '2025',
      }),
      repo.create({
        name: 'MARTIN',
        firstName: 'Marie',
        licenceNumber: '87654321',
        gender: 'F',
        club: 'Cyclo Club Gascon',
        dept: '32',
        birthYear: '1990',
        catea: 'FS',
        catev: '3',
        fede: Federation.FSGT,
        saison: '2025',
      }),
      repo.create({
        name: 'GARCÍA',
        firstName: 'Pierre',
        licenceNumber: '11223344',
        gender: 'H',
        club: 'Racing Club Bordelais',
        dept: '33',
        birthYear: '1978',
        catea: 'V',
        catev: '1',
        fede: Federation.FFC,
        saison: '2025',
      }),
    ]);
  }

  /** Crée 3 compétitions de test et retourne les entités */
  async seedCompetitions(clubs?: ClubEntity[]): Promise<CompetitionEntity[]> {
    const repo = this.dataSource.getRepository(CompetitionEntity);
    return repo.save([
      repo.create({
        name: 'Grand Prix de Toulouse',
        eventDate: new Date('2025-06-15T09:00:00Z'),
        zipCode: '31000',
        categories: '1,2,3',
        races: '1/2,3',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
        ...(clubs?.[0] ? { clubId: clubs[0].id } : {}),
      }),
      repo.create({
        name: 'Cyclo-cross de Auch',
        eventDate: new Date('2025-11-20T10:00:00Z'),
        zipCode: '32000',
        categories: '1,2,3',
        races: '1/2/3',
        fede: Federation.FSGT,
        competitionType: CompetitionType.CX,
        dept: '33',
        ...(clubs?.[1] ? { clubId: clubs[1].id } : {}),
      }),
      repo.create({
        name: 'Gravel des Pyrénées',
        eventDate: new Date('2025-09-01T08:00:00Z'),
        zipCode: '65000',
        categories: '1,2',
        races: '1,2',
        fede: Federation.FFC,
        competitionType: CompetitionType.GRAVEL,
        dept: '32',
        ...(clubs?.[2] ? { clubId: clubs[2].id } : {}),
      }),
    ]);
  }

  /** Crée 3 engagements (races) de test et retourne les entités */
  async seedRaces(
    competitions: CompetitionEntity[],
    licences: LicenceEntity[],
  ): Promise<RaceEntity[]> {
    const repo = this.dataSource.getRepository(RaceEntity);
    return repo.save([
      repo.create({
        competitionId: competitions[0].id,
        licenceId: licences[0].id,
        raceCode: '1/2',
        catev: '2',
        catea: 'S',
        riderNumber: 101,
        club: licences[0].club,
      }),
      repo.create({
        competitionId: competitions[0].id,
        licenceId: licences[1].id,
        raceCode: '3',
        catev: '3',
        catea: 'FS',
        riderNumber: 201,
        club: licences[1].club,
      }),
      repo.create({
        competitionId: competitions[1].id,
        licenceId: licences[2].id,
        raceCode: '1/2/3',
        catev: '1',
        catea: 'V',
        riderNumber: 301,
        club: licences[2].club,
      }),
    ]);
  }

  /** Crée 2 challenges de test et retourne les entités */
  async seedChallenges(competitionIds?: number[]): Promise<ChallengeEntity[]> {
    const repo = this.dataSource.getRepository(ChallengeEntity);
    return repo.save([
      repo.create({
        name: 'Challenge Route FSGT 31',
        description: 'Challenge route saison 2025',
        active: true,
        competitionIds: competitionIds ?? [],
        bareme: 'CHALLENGE_FSGT_31',
        competitionType: 'ROUTE',
      }),
      repo.create({
        name: 'Challenge CX FSGT',
        description: 'Challenge cyclo-cross saison 2025',
        active: false,
        competitionIds: [],
        bareme: 'CHALLENGE_FSGT_31_CX',
        competitionType: 'CX',
      }),
    ]);
  }

  /** Seed complet : clubs → licences → compétitions → races */
  async seedFullDataset(): Promise<{
    clubs: ClubEntity[];
    licences: LicenceEntity[];
    competitions: CompetitionEntity[];
    races: RaceEntity[];
  }> {
    const clubs = await this.seedClubs();
    const licences = await this.seedLicences();
    const competitions = await this.seedCompetitions(clubs);
    const races = await this.seedRaces(competitions, licences);
    return { clubs, licences, competitions, races };
  }

  /** Supprime uniquement les licences */
  async cleanLicences(): Promise<void> {
    await this.dataSource.getRepository(LicenceEntity).query('TRUNCATE TABLE "licence" CASCADE');
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

  /** Supprime uniquement les compétitions */
  async cleanCompetitions(): Promise<void> {
    await this.dataSource
      .getRepository(CompetitionEntity)
      .query('TRUNCATE TABLE "competition" CASCADE');
  }

  /** Supprime uniquement les races */
  async cleanRaces(): Promise<void> {
    await this.dataSource.getRepository(RaceEntity).query('TRUNCATE TABLE "race" CASCADE');
  }

  /** Supprime uniquement les challenges */
  async cleanChallenges(): Promise<void> {
    await this.dataSource
      .getRepository(ChallengeEntity)
      .query('TRUNCATE TABLE "challenge" CASCADE');
  }

  /** Supprime les utilisateurs ajoutés en test (préserve les 3 seed users) */
  async cleanUsers(): Promise<void> {
    await this.dataSource
      .getRepository(UserEntity)
      .query('DELETE FROM "user" WHERE id > 3');
  }
}
