import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LicenceEntity } from '../entity/licence.entity';
import { FederationEntity } from '../entity/federation.entity';

@Injectable()
export class LicenceService {
  constructor(
    @InjectRepository(LicenceEntity)
    private readonly repository: Repository<LicenceEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async createLicence(
    licence: LicenceEntity,
    author: string,
  ): Promise<LicenceEntity> {
    const newLicence = new LicenceEntity();
    newLicence.licenceNumber = licence.licenceNumber?.trim();
    newLicence.name = licence.name?.trim();
    newLicence.firstName = licence.firstName.trim();
    newLicence.gender = licence.gender.toUpperCase();
    newLicence.club = licence.club;
    newLicence.dept = licence.dept;
    newLicence.birthYear = licence.birthYear;
    newLicence.catea = licence.catea;
    if (licence.catev && licence.catev.length > 0) {
      newLicence.catev = licence.catev.toUpperCase();
    }
    if (licence.catevCX && licence.catevCX.length > 0) {
      newLicence.catevCX = licence.catevCX.toUpperCase();
    }
    newLicence.fede = licence.fede;
    newLicence.comment = licence.comment;
    newLicence.saison = licence.saison;
    newLicence.author = author;
    newLicence.lastChanged = new Date();
    const licenceInserted = await this.entityManager.save(newLicence);
    return licenceInserted;
  }

  async getLicenceByNumber(licenceNumber: string) {
    return this.repository.findOne({
      where: {
        licenceNumber,
        fede: FederationEntity.FSGT
      }
    });
  }

  async getRiderByBirthYearAndName(
    birthYear: string,
    name: string,
    firstName: string,
  ) {
    return this.repository
      .createQueryBuilder()
      .where(
        'REPLACE(LOWER(unaccent(first_name)), \'-\', \' \') = LOWER(:firstName) AND name = :name AND birth_year = :birthYear AND fede = \'FSGT\'',
        {
          firstName: firstName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/-/g, ' ')
            .toLowerCase(),
          name,
          birthYear,
        },
      )
      .getOne();
  }
}
