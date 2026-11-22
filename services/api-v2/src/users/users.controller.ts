import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ForbiddenException } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ClubEntity } from '../clubs/entities/club.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Role } from '../common/enums';
import { FilterUserDto } from './dto/filter-user.dto';
import { SetUserClubsDto } from './dto/set-user-clubs.dto';
import { UserResponseDto, toUserResponse } from './dto/user-response.dto';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination (super admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async findAll(@Query() filterDto: FilterUserDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const page = await this.usersService.findAll(filterDto);
    return { data: page.data.map(toUserResponse), meta: page.meta };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID (super admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return toUserResponse(await this.usersService.findOne(id));
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new user (super admin only)' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('email') author: string,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.usersService.create(createUserDto, author));
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a user (super admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('email') author: string,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.usersService.update(id, updateUserDto, author));
  }

  @Post(':id/reset-password')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset user password (super admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword') newPassword: string,
  ): Promise<{ success: boolean }> {
    return this.usersService.resetPassword(id, newPassword);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user (super admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    await this.usersService.remove(id);
    return { success: true };
  }

  @Get(':id/clubs')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: 'Lister les clubs liés à un user (SUPER_ADMIN, ou le user lui-même)',
    description:
      "SUPER_ADMIN peut consulter les clubs de n'importe quel user. Les autres rôles ne peuvent consulter QUE leur propre profil (`:id == currentUser.id`). Utilisé par l'écran 'Mon compte' pour afficher la liste read-only des clubs gérés.",
  })
  @ApiResponse({ status: 200, description: 'Liste des clubs (triés alphabétiquement)' })
  @ApiResponse({ status: 403, description: 'Pas le droit de consulter les clubs de cet user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserClubs(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClubEntity[]> {
    if (!user.roles.includes(Role.SUPER_ADMIN) && user.id !== id) {
      throw new ForbiddenException('Vous ne pouvez consulter que vos propres clubs');
    }
    return this.usersService.findUserClubs(id);
  }

  @Put(':id/clubs')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Définir l'ensemble complet des clubs liés à un user (set, idempotent, super admin only)",
  })
  @ApiResponse({ status: 200, description: "Liens mis à jour, retourne l'état final + diff" })
  @ApiResponse({ status: 404, description: 'User ou clubs introuvables' })
  async setUserClubs(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserClubsDto,
    @CurrentUser('email') author: string,
  ): Promise<{ clubs: ClubEntity[]; added: number[]; removed: number[] }> {
    return this.usersService.setUserClubs(id, dto.clubIds, author);
  }
}
