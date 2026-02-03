import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { FilterUserDto } from './dto/filter-user.dto';
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

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findAll(filterDto: FilterUserDto): Promise<PaginatedResponseDto<UserEntity>> {
    const {
      offset = 0,
      limit = 20,
      search,
      orderBy = 'lastName',
      orderDirection = 'ASC',
    } = filterDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Global search across email, firstName, lastName
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Ordering
    const validOrderFields = ['id', 'email', 'firstName', 'lastName', 'phone', 'roles'];
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

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
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

    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    if (updateUserDto.firstName !== undefined) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) user.lastName = updateUserDto.lastName;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
    if (updateUserDto.roles !== undefined) user.roles = updateUserDto.roles.join(',');

    return this.userRepository.save(user);
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isPasswordValid = await bcrypt.compare(updatePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 12);
    await this.userRepository.update(id, { password: hashedPassword });

    return { success: true };
  }

  async resetPassword(id: number, newPassword: string): Promise<{ success: boolean }> {
    await this.findOne(id);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(id, { password: hashedPassword });
    return { success: true };
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
