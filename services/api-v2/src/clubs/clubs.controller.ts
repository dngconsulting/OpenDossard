import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { ClubEntity } from './entities/club.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, Federation } from '../common/enums';

@ApiTags('Clubs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clubs, optionally filtered by federation and department' })
  @ApiQuery({ name: 'fede', required: false, enum: Federation })
  @ApiQuery({ name: 'dept', required: false })
  @ApiResponse({ status: 200, description: 'List of clubs' })
  async findAll(
    @Query('fede') fede?: Federation,
    @Query('dept') dept?: string,
  ): Promise<ClubEntity[]> {
    return this.clubsService.findAll(fede, dept);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club by ID' })
  @ApiResponse({ status: 200, description: 'Club details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ClubEntity | null> {
    return this.clubsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create a new club' })
  @ApiResponse({ status: 201, description: 'Club created' })
  async create(@Body() clubData: Partial<ClubEntity>): Promise<ClubEntity> {
    return this.clubsService.create(clubData);
  }
}
