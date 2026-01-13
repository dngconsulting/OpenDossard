import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { LicenceEntity } from './entities/licence.entity';
import {
  CreateLicenceDto,
  UpdateLicenceDto,
  FilterLicenceDto,
} from './dto';
import { PaginatedResponseDto } from '../common/dto';

@Injectable()
export class LicencesService {
  constructor(
    @InjectRepository(LicenceEntity)
    private licenceRepository: Repository<LicenceEntity>,
  ) {}

  async findAll(
    filterDto: FilterLicenceDto,
  ): Promise<PaginatedResponseDto<LicenceEntity>> {
    const {
      offset = 0,
      limit = 20,
      search,
      orderBy = 'name',
      orderDirection = 'ASC',
      id,
      name,
      firstName,
      licenceNumber,
      club,
      dept,
      fede,
      gender,
      birthYear,
      catea,
      catev,
      catevCX,
      saison,
      withoutNumber,
    } = filterDto;

    const queryBuilder = this.licenceRepository.createQueryBuilder('licence');

    // Global search
    if (search) {
      const searchPattern = `%${search}%`;
      queryBuilder.andWhere(
        '(licence.name ILIKE :search OR licence.firstName ILIKE :search OR licence.licenceNumber ILIKE :search OR licence.club ILIKE :search)',
        { search: searchPattern },
      );
    }

    // Specific filters - all combined with AND
    if (id) {
      queryBuilder.andWhere('licence.id = :id', { id });
    }
    if (name) {
      queryBuilder.andWhere('licence.name ILIKE :name', { name: `%${name}%` });
    }
    if (firstName) {
      queryBuilder.andWhere('licence.firstName ILIKE :firstName', {
        firstName: `%${firstName}%`,
      });
    }
    if (licenceNumber) {
      queryBuilder.andWhere('licence.licenceNumber ILIKE :licenceNumber', {
        licenceNumber: `%${licenceNumber}%`,
      });
    }
    if (club) {
      queryBuilder.andWhere('licence.club ILIKE :club', { club: `%${club}%` });
    }
    if (dept) {
      queryBuilder.andWhere('licence.dept ILIKE :dept', { dept: `%${dept}%` });
    }
    if (fede) {
      queryBuilder.andWhere('licence.fede ILIKE :fede', { fede: `%${fede}%` });
    }
    if (gender) {
      queryBuilder.andWhere('licence.gender ILIKE :gender', { gender: `%${gender}%` });
    }
    if (birthYear) {
      queryBuilder.andWhere('licence.birthYear ILIKE :birthYear', { birthYear: `%${birthYear}%` });
    }
    if (catea) {
      queryBuilder.andWhere('licence.catea ILIKE :catea', { catea: `%${catea}%` });
    }
    if (catev) {
      queryBuilder.andWhere('licence.catev ILIKE :catev', { catev: `%${catev}%` });
    }
    if (catevCX) {
      queryBuilder.andWhere('licence.catevCX ILIKE :catevCX', { catevCX: `%${catevCX}%` });
    }
    if (saison) {
      queryBuilder.andWhere('licence.saison ILIKE :saison', { saison: `%${saison}%` });
    }
    if (withoutNumber) {
      queryBuilder.andWhere(
        '(licence.licenceNumber IS NULL OR licence.licenceNumber = :empty)',
        { empty: '' },
      );
    }

    // Ordering
    const validOrderFields = [
      'id',
      'name',
      'firstName',
      'licenceNumber',
      'club',
      'dept',
      'fede',
      'gender',
      'birthYear',
      'catea',
      'catev',
      'catevCX',
      'saison',
    ];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'name';
    queryBuilder.orderBy(
      `licence.${orderField}`,
      orderDirection as 'ASC' | 'DESC',
    );

    // Pagination with offset/limit
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, offset, limit);
  }

  async findOne(id: number): Promise<LicenceEntity> {
    const licence = await this.licenceRepository.findOne({ where: { id } });
    if (!licence) {
      throw new NotFoundException(`Licence with ID ${id} not found`);
    }
    return licence;
  }

  async search(query: string, competitionType?: string): Promise<LicenceEntity[]> {
    const searchPattern = `%${query}%`;

    return this.licenceRepository
      .createQueryBuilder('licence')
      .where(
        '(licence.name ILIKE :search OR licence.firstName ILIKE :search OR licence.licenceNumber ILIKE :search)',
        { search: searchPattern },
      )
      .orderBy('licence.name', 'ASC')
      .take(20)
      .getMany();
  }

  async create(
    createLicenceDto: CreateLicenceDto,
    author?: string,
  ): Promise<LicenceEntity> {
    const licence = this.licenceRepository.create({
      ...createLicenceDto,
      author,
      lastChanged: new Date(),
    });
    return this.licenceRepository.save(licence);
  }

  async update(
    id: number,
    updateLicenceDto: UpdateLicenceDto,
    author?: string,
  ): Promise<LicenceEntity> {
    const licence = await this.findOne(id);

    Object.assign(licence, {
      ...updateLicenceDto,
      author,
      lastChanged: new Date(),
    });

    return this.licenceRepository.save(licence);
  }

  async remove(id: number): Promise<void> {
    const licence = await this.findOne(id);
    await this.licenceRepository.remove(licence);
  }

  async importFromCsv(
    fileContent: string,
    author?: string,
  ): Promise<{ imported: number; errors: string[] }> {
    const lines = fileContent.split('\n');
    const errors: string[] = [];
    let imported = 0;

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const fields = line.split(';');
        // Parse CSV fields according to e-licence format
        // This is a simplified version - adjust according to actual CSV format
        const licence = this.licenceRepository.create({
          licenceNumber: fields[0]?.trim(),
          name: fields[1]?.trim(),
          firstName: fields[2]?.trim(),
          birthYear: fields[3]?.trim(),
          gender: fields[4]?.trim(),
          club: fields[5]?.trim(),
          dept: fields[6]?.trim(),
          author,
          lastChanged: new Date(),
        });

        await this.licenceRepository.save(licence);
        imported++;
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    return { imported, errors };
  }
}
