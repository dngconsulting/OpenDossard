import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

import { UserClubEntity } from '../../src/auth/entities/user-club.entity';
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

  /** Crée un user mobile Firebase (firebase_uid renseigné, sans email) et le retourne */
  async seedFirebaseUser(uid = 'test-firebase-uid-001'): Promise<UserEntity> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    return userRepo.save(
      userRepo.create({
        email: null,
        password: TEST_PASSWORD_HASH,
        firstName: 'Mobile',
        lastName: 'Firebase',
        roles: 'MOBILE',
        firebaseUid: uid,
      }),
    );
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

  /** Crée des licences avec noms composés pour tester la recherche */
  async seedCompoundNameLicences(): Promise<LicenceEntity[]> {
    const repo = this.dataSource.getRepository(LicenceEntity);
    return repo.save([
      repo.create({
        name: 'DE MARCHI',
        firstName: 'Victor',
        licenceNumber: '55551111',
        gender: 'H',
        club: 'TOAC',
        dept: '31',
        birthYear: '1992',
        catea: 'S',
        catev: '2',
        fede: Federation.FSGT,
        saison: '2025',
      }),
      repo.create({
        name: 'DA SILVA',
        firstName: 'Manu',
        licenceNumber: '55552222',
        gender: 'H',
        club: 'Cyclo Club Gascon',
        dept: '32',
        birthYear: '1988',
        catea: 'S',
        catev: '3',
        fede: Federation.FSGT,
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

  /**
   * Jeu de données de l'encart « Performances du club ».
   *
   * Deux compétitions, construites pour exercer les pièges du calcul de rang :
   *
   * 1. « Départ mixte » (code course 1/2, catégories 1 et 2 confondues), avec
   *    des `ranking_scratch` aux magnitudes volontairement corrompues (211,
   *    261 … 2217) mais dans le bon ordre — le profil exact de la corruption
   *    constatée en base. Les 4 premiers au scratch sont des catégorie 1 d'un
   *    club tiers : GASSMANN n'est donc que 5e au scratch, mais 1er de sa
   *    catégorie. Un comptage sur `ranking_scratch = 1` ne verrait rien ici.
   * 2. « Départ homogène » un mois plus tard, où GASSMANN gagne en catégorie 1
   *    après montée — il doit produire une seconde entrée, la clé d'agrégation
   *    étant (licence, catégorie).
   *
   * Le club porte aussi deux cas négatifs : MARTY, 4e de catégorie (aucun
   * compteur, donc écarté par le HAVING), et ROUX, abandon crédité d'un
   * challenge sprint (ne doit pas compter, faute de rang).
   */
  async seedClubPerformancesDataset(): Promise<{
    club: string;
    otherClub: string;
    competitions: CompetitionEntity[];
  }> {
    const CLUB = 'Vélo Club Toulousain';
    const OTHER_CLUB = 'AS Muret';

    const licenceRepo = this.dataSource.getRepository(LicenceEntity);
    const makeLicence = (name: string, firstName: string, club: string, catev: string) =>
      licenceRepo.create({
        name,
        firstName,
        licenceNumber: `PERF-${name}`,
        gender: 'H',
        club,
        dept: '31',
        birthYear: '1985',
        catea: 'S',
        catev,
        fede: Federation.FSGT,
        saison: '2025',
      });

    const [gassmann, jaber, marty, roux, alpha, beta, gamma, delta, epsilon] =
      await licenceRepo.save([
        makeLicence('GASSMANN', 'Pierre', CLUB, '2'),
        makeLicence('JABER', 'Sami', CLUB, '2'),
        makeLicence('MARTY', 'Luc', CLUB, '2'),
        makeLicence('ROUX', 'Alex', CLUB, '2'),
        makeLicence('ALPHA', 'Adrien', OTHER_CLUB, '1'),
        makeLicence('BETA', 'Bruno', OTHER_CLUB, '1'),
        makeLicence('GAMMA', 'Cyril', OTHER_CLUB, '1'),
        makeLicence('DELTA', 'David', OTHER_CLUB, '1'),
        makeLicence('EPSILON', 'Eric', OTHER_CLUB, '2'),
      ]);

    // Deux licenciés UFOLEP portant le MÊME libellé de club que l'équipe FSGT :
    // le cas « CAHORS CYCLISME », homonyme entre fédérations. Sans la fédé, le
    // seul nom de club les mélangerait avec les précédents.
    const [ufoOpen, ufoHome] = await licenceRepo.save([
      licenceRepo.create({
        name: 'OPENRIDER',
        firstName: 'Olivier',
        licenceNumber: 'PERF-OPENRIDER',
        gender: 'H',
        club: CLUB,
        dept: '31',
        birthYear: '1985',
        catea: 'S',
        catev: '2',
        fede: Federation.UFOLEP,
        saison: '2025',
      }),
      licenceRepo.create({
        name: 'HOMONYME',
        firstName: 'Hugo',
        licenceNumber: 'PERF-HOMONYME',
        gender: 'H',
        club: CLUB,
        dept: '31',
        birthYear: '1985',
        catea: 'S',
        catev: '2',
        fede: Federation.UFOLEP,
        saison: '2025',
      }),
    ]);

    const competitionRepo = this.dataSource.getRepository(CompetitionEntity);
    const competitions = await competitionRepo.save([
      competitionRepo.create({
        name: 'Départ mixte de Toulouse',
        eventDate: new Date('2025-06-15T09:00:00Z'),
        zipCode: '31000',
        categories: '1,2',
        races: '1/2',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
      }),
      competitionRepo.create({
        name: 'Départ homogène de Muret',
        eventDate: new Date('2025-07-20T09:00:00Z'),
        zipCode: '31600',
        categories: '1',
        races: '1',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
      }),
      // Épreuve FSGT gagnée par un licencié UFOLEP : un licencié peut courir
      // hors de sa fédération, mais ce résultat appartient au club FSGT, pas au
      // club UFOLEP homonyme. Sert à vérifier le volet « identité ».
      competitionRepo.create({
        name: 'Open FSGT de Blagnac',
        eventDate: new Date('2025-08-10T09:00:00Z'),
        zipCode: '31700',
        categories: '2',
        races: '2',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
      }),
      // Épreuve UFOLEP : seule à devoir alimenter les stats du club UFOLEP
      // homonyme. Sert à vérifier le volet « périmètre ».
      competitionRepo.create({
        name: 'Prix UFOLEP de Colomiers',
        eventDate: new Date('2025-09-15T09:00:00Z'),
        zipCode: '31770',
        categories: '2',
        races: '2',
        fede: Federation.UFOLEP,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
      }),
    ]);

    const raceRepo = this.dataSource.getRepository(RaceEntity);
    const entry = (
      competition: CompetitionEntity,
      licence: LicenceEntity,
      raceCode: string,
      catev: string,
      rankingScratch: number | null,
      extra: Partial<RaceEntity> = {},
    ) =>
      raceRepo.create({
        competitionId: competition.id,
        licenceId: licence.id,
        raceCode,
        catev,
        catea: 'S',
        club: licence.club,
        rankingScratch,
        ...extra,
      });

    await raceRepo.save([
      // Départ mixte : les 4 premiers au scratch courent en catégorie 1.
      entry(competitions[0], alpha, '1/2', '1', 211),
      entry(competitions[0], beta, '1/2', '1', 261),
      entry(competitions[0], gamma, '1/2', '1', 297),
      entry(competitions[0], delta, '1/2', '1', 304),
      // 5e au scratch, 1er de catégorie 2, et vainqueur du challenge sprint.
      entry(competitions[0], gassmann, '1/2', '2', 2179, { sprintchallenge: true }),
      entry(competitions[0], jaber, '1/2', '2', 2193),
      entry(competitions[0], epsilon, '1/2', '2', 2213),
      entry(competitions[0], marty, '1/2', '2', 2217),
      // Abandon : aucun rang, donc aucun challenge sprint comptabilisé.
      entry(competitions[0], roux, '1/2', '2', null, {
        comment: 'ABD',
        sprintchallenge: true,
      }),
      // Départ homogène : GASSMANN gagne, cette fois en catégorie 1.
      entry(competitions[1], gassmann, '1', '1', 1),
      entry(competitions[1], alpha, '1', '1', 2),
      entry(competitions[1], beta, '1', '1', 3),
      // Open FSGT gagné par un licencié UFOLEP sous le libellé du club :
      // l'épreuve est FSGT mais la licence ne l'est pas, donc hors des deux clubs.
      entry(competitions[2], ufoOpen, '2', '2', 1),
      entry(competitions[2], epsilon, '2', '2', 2),
      // Épreuve UFOLEP gagnée par le licencié UFOLEP du club homonyme.
      entry(competitions[3], ufoHome, '2', '2', 1),
      entry(competitions[3], ufoOpen, '2', '2', 2),
    ]);

    return { club: CLUB, otherClub: OTHER_CLUB, competitions };
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

  /**
   * Rattache un user à des clubs (modèle d'autorisation scopé). Indispensable
   * pour les tests ORGANISATEUR qui touchent à des ressources scopées par club
   * (compétitions, HelloAsso OAuth). ADMIN bypasse ce mécanisme — pas besoin
   * d'appeler ce helper pour les tests ADMIN.
   */
  async seedUserClubs(links: { userId: number; clubId: number }[]): Promise<void> {
    const repo = this.dataSource.getRepository(UserClubEntity);
    await repo.save(links.map(l => repo.create(l)));
  }

  /** Supprime tous les liens user↔club (préserve users et clubs) */
  async cleanUserClubs(): Promise<void> {
    await this.dataSource.getRepository(UserClubEntity).query('TRUNCATE TABLE "user_club" CASCADE');
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
    await this.dataSource.getRepository(UserEntity).query('DELETE FROM "user" WHERE id > 3');
  }
}
