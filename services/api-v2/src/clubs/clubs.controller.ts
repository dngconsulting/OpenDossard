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
import { Role, Federation } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { FilterClubDto } from './dto/filter-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@ApiTags('Clubs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

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
      'Get all clubs (legacy, no pagination), optionally filtered by federation and department',
  })
  @ApiQuery({ name: 'fede', required: false, enum: Federation })
  @ApiQuery({ name: 'dept', required: false })
  @ApiResponse({ status: 200, description: 'List of clubs' })
  async findAllLegacy(
    @Query('fede') fede?: Federation,
    @Query('dept') dept?: string,
  ): Promise<ClubEntity[]> {
    return this.clubsService.findAll(fede, dept);
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
  async create(@Body() clubData: Partial<ClubEntity>): Promise<ClubEntity> {
    return this.clubsService.create(clubData);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a club' })
  @ApiResponse({ status: 200, description: 'Club updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClubDto,
  ): Promise<ClubEntity> {
    return this.clubsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a club (only if unreferenced)' })
  @ApiResponse({ status: 200, description: 'Club deleted' })
  @ApiResponse({ status: 409, description: 'Club is referenced and cannot be deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    await this.clubsService.remove(id);
    return { success: true };
  }
}
