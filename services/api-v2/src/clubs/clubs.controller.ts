import {
  Controller,
  Get,
  Post,
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { ClubEntity } from './entities/club.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AuthorizationService } from '../auth/authorization.service';
import { Role, Federation } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { FilterClubDto } from './dto/filter-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { AccessibleClubsScopeDto } from './dto/accessible-clubs.dto';

@ApiTags('Clubs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly clubsService: ClubsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get all clubs with pagination, search and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated list of clubs' })
  async findAll(@Query() filterDto: FilterClubDto): Promise<PaginatedResponseDto<ClubEntity>> {
    return this.clubsService.findAllPaginated(filterDto);
  }

  @Get('legacy')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary:
      'Get all clubs (legacy, no pagination), optionally filtered by federation and department(s)',
  })
  @ApiQuery({
    name: 'fede',
    required: false,
    enum: Federation,
    isArray: true,
    description:
      'Filtre par fédération(s). Répétable : `?fede=FSGT&fede=UFOLEP`. NestJS accepte la même requête avec une valeur unique (`?fede=FSGT`).',
  })
  @ApiQuery({
    name: 'dept',
    required: false,
    isArray: true,
    description:
      'Filtre par département(s). Répétable : `?dept=31&dept=81&dept=82`. NestJS accepte la même requête avec une valeur unique (`?dept=31`).',
  })
  @ApiResponse({ status: 200, description: 'List of clubs' })
  async findAllLegacy(
    @Query('fede') fede?: Federation | Federation[],
    @Query('dept') dept?: string | string[],
  ): Promise<ClubEntity[]> {
    return this.clubsService.findAll(fede, dept);
  }

  @Get('me/accessible')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: "Scope d'édition/suppression de clubs pour l'utilisateur courant",
    description:
      "ADMIN renvoie `{ scope: 'ALL' }`, les autres renvoient `{ scope: 'SCOPED', clubIds: [...] }`. " +
      'Utilisé par le frontend pour griser les boutons édit/suppr sur la liste des clubs.',
  })
  @ApiResponse({ status: 200, type: AccessibleClubsScopeDto })
  async getMyAccessibleScope(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AccessibleClubsScopeDto> {
    return this.authorizationService.getAccessibleClubsScope(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get club by ID' })
  @ApiResponse({ status: 200, description: 'Club details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ClubEntity> {
    return this.clubsService.findOne(id);
  }

  @Get(':id/references')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Count references to this club in races, licences and competitions' })
  @ApiResponse({ status: 200, description: 'Reference counts' })
  async countReferences(@Param('id', ParseIntPipe) id: number) {
    return this.clubsService.countReferences(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create a new club' })
  @ApiResponse({ status: 201, description: 'Club created' })
  async create(
    @Body() clubData: Partial<ClubEntity>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClubEntity> {
    return this.clubsService.create(clubData, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a club' })
  @ApiResponse({ status: 200, description: 'Club updated' })
  @ApiResponse({
    status: 403,
    description: "L'utilisateur n'est pas lié à ce club (autorisation scopée).",
  })
  @ApiResponse({
    status: 409,
    description: 'Club lié à HelloAsso : délier (DELETE /helloasso/clubs/:id) avant de modifier',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClubDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClubEntity> {
    await this.authorizationService.assertClubAccess(user, id);
    return this.clubsService.update(id, dto, user.email);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a club (only if unreferenced)' })
  @ApiResponse({ status: 200, description: 'Club deleted' })
  @ApiResponse({
    status: 403,
    description: "L'utilisateur n'est pas lié à ce club (autorisation scopée).",
  })
  @ApiResponse({
    status: 409,
    description: 'Club lié à HelloAsso, ou référencé par des compétitions / courses / licences',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.authorizationService.assertClubAccess(user, id);
    await this.clubsService.remove(id);
    return { success: true };
  }
}
