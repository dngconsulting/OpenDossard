import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { UserClubService } from '../auth/user-club.service';
import { ClubsService } from '../clubs/clubs.service';
import { ClubEntity } from '../clubs/entities/club.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { FilterUserDto, UserSource } from './dto/filter-user.dto';
import { UserEntity } from './entities/user.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles?: string[];
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly userClubService: UserClubService,
    private readonly clubsService: ClubsService,
  ) {}

  async findAll(filterDto: FilterUserDto): Promise<PaginatedResponseDto<UserEntity>> {
    const {
      offset = 0,
      limit = 20,
      search,
      source,
      orderBy = 'lastName',
      orderDirection = 'ASC',
    } = filterDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Filtre par origine du compte : firebase_uid discrimine les users
    // mobile Firebase (Dossardeur) des users backoffice (Open Dossard)
    if (source === UserSource.DOSSARDEUR) {
      queryBuilder.andWhere('user.firebaseUid IS NOT NULL');
    } else if (source === UserSource.OPENDOSSARD) {
      queryBuilder.andWhere('user.firebaseUid IS NULL');
    }

    // Global search across email, firstName, lastName, firebaseUid (les users
    // firebase n'ont pas d'email : leur identifiant visible est le firebase_uid)
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.firebaseUid) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Ordering
    const validOrderFields = [
      'id',
      'email',
      'firstName',
      'lastName',
      'phone',
      'roles',
      'firebaseUid',
    ];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'lastName';
    queryBuilder.orderBy(`user.${orderField}`, orderDirection);

    // Secondary sort for consistency
    if (orderField !== 'lastName') {
      queryBuilder.addOrderBy('user.lastName', 'ASC');
    }
    if (orderField !== 'firstName') {
      queryBuilder.addOrderBy('user.firstName', 'ASC');
    }

    // Pagination
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, offset, limit);
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto, author?: string): Promise<UserEntity> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const roles = createUserDto.roles ? createUserDto.roles.join(',') : 'ORGANISATEUR';

    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone: createUserDto.phone,
      roles,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(
      `Création de l'utilisateur #${saved.id} par ${author ?? 'inconnu'} | ` +
        `${saved.email} | Prénom: ${saved.firstName ?? '-'} | Nom: ${saved.lastName ?? '-'} | ` +
        `Rôles: ${saved.roles ?? '-'}`,
    );
    return saved;
  }

  async update(id: number, updateUserDto: UpdateUserDto, author?: string): Promise<UserEntity> {
    const user = await this.findOne(id);

    // Garde-fou : les users firebase sont read-only depuis le backoffice.
    // Leur édition doit passer par l'app mobile (ou Firebase Console).
    // Le mobile passe par le endpoint dédié `/auth/profile` qui ne traverse
    // pas ce service.
    if (user.firebaseUid) {
      throw new ForbiddenException(
        'Firebase users are read-only from the backoffice. Edit via the mobile app.',
      );
    }

    if (updateUserDto.firstName !== undefined) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) user.lastName = updateUserDto.lastName;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
    if (updateUserDto.roles !== undefined) user.roles = updateUserDto.roles.join(',');

    const saved = await this.userRepository.save(user);
    const fields = Object.keys(updateUserDto)
      .filter(k => k !== 'phone' && (updateUserDto as Record<string, unknown>)[k] !== undefined)
      .map(k => `${k}: ${String((updateUserDto as Record<string, unknown>)[k])}`)
      .join(' | ');
    this.logger.log(
      `Mise à jour de l'utilisateur #${id} par ${author ?? 'inconnu'} | ` +
        `${saved.email} | ${fields}`,
    );
    return saved;
  }

  async resetPassword(id: number, newPassword: string): Promise<{ success: boolean }> {
    await this.findOne(id);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(id, { password: hashedPassword });
    return { success: true };
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    if (user.firebaseUid) {
      throw new ForbiddenException(
        'Firebase users cannot be deleted from the backoffice. Delete via Firebase Console.',
      );
    }
    await this.userRepository.remove(user);
  }

  /**
   * Liste des clubs liés au user, triés alphabétiquement sur `longName`.
   * 404 si le user n'existe pas.
   */
  async findUserClubs(userId: number): Promise<ClubEntity[]> {
    await this.findOne(userId);
    const clubIds = await this.userClubService.findClubIdsForUser(userId);
    return this.clubsService.findByIds(clubIds);
  }

  /**
   * Set complet des clubs liés au user. Valide que tous les `clubIds` existent
   * en DB avant d'appliquer (sinon NotFoundException listant les manquants).
   * Retourne l'état final + le diff appliqué (added/removed) pour log/UI.
   */
  async setUserClubs(
    userId: number,
    clubIds: number[],
    author?: string,
  ): Promise<{ clubs: ClubEntity[]; added: number[]; removed: number[] }> {
    const user = await this.findOne(userId);

    const uniqueIds = [...new Set(clubIds)];
    if (uniqueIds.length > 0) {
      const found = await this.clubsService.findByIds(uniqueIds);
      if (found.length !== uniqueIds.length) {
        const foundIds = new Set(found.map(c => c.id));
        const missing = uniqueIds.filter(id => !foundIds.has(id));
        throw new NotFoundException(`Clubs introuvables : ${missing.join(', ')}`);
      }
    }

    const { added, removed } = await this.userClubService.setClubIdsForUser(userId, uniqueIds);

    this.logger.log(
      `Mise à jour des clubs de l'utilisateur #${userId} (${user.email ?? '-'}) par ${author ?? 'inconnu'} | +[${added.join(',')}] -[${removed.join(',')}]`,
    );

    const clubs = await this.clubsService.findByIds(uniqueIds);
    return { clubs, added, removed };
  }
}
