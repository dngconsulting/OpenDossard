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
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LicencesService } from './licences.service';
import { LicenceImportService } from './licence-import.service';
import { LicenceEntity } from './entities/licence.entity';
import {
  CreateLicenceDto,
  UpdateLicenceDto,
  FilterLicenceDto,
  ImportResultDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto';

@ApiTags('Licences')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('licences')
export class LicencesController {
  constructor(
    private readonly licencesService: LicencesService,
    private readonly licenceImportService: LicenceImportService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get all licences with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of licences' })
  async findAll(
    @Query() filterDto: FilterLicenceDto,
  ): Promise<PaginatedResponseDto<LicenceEntity>> {
    return this.licencesService.findAll(filterDto);
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Search licences by name or number (autocomplete)' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, description: 'Competition type (CX, ROUTE)' })
  @ApiResponse({ status: 200, description: 'List of matching licences' })
  async search(
    @Query('q') query: string,
    @Query('type') competitionType?: string,
  ): Promise<LicenceEntity[]> {
    return this.licencesService.search(query, competitionType);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get licence by ID' })
  @ApiParam({ name: 'id', description: 'Licence ID' })
  @ApiResponse({ status: 200, description: 'Licence details' })
  @ApiResponse({ status: 404, description: 'Licence not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LicenceEntity> {
    return this.licencesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create a new licence' })
  @ApiResponse({ status: 201, description: 'Licence created' })
  async create(
    @Body() createLicenceDto: CreateLicenceDto,
    @CurrentUser('email') author: string,
  ): Promise<LicenceEntity> {
    return this.licencesService.create(createLicenceDto, author);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a licence' })
  @ApiParam({ name: 'id', description: 'Licence ID' })
  @ApiResponse({ status: 200, description: 'Licence updated' })
  @ApiResponse({ status: 404, description: 'Licence not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLicenceDto: UpdateLicenceDto,
    @CurrentUser('email') author: string,
  ): Promise<LicenceEntity> {
    return this.licencesService.update(id, updateLicenceDto, author);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a licence' })
  @ApiParam({ name: 'id', description: 'Licence ID' })
  @ApiResponse({ status: 200, description: 'Licence deleted' })
  @ApiResponse({ status: 404, description: 'Licence not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    await this.licencesService.remove(id);
    return { success: true };
  }

  @Post('import')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import licences from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Import result' })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('email') author: string,
  ): Promise<ImportResultDto> {
    const content = file.buffer.toString('utf-8');
    return this.licenceImportService.importFromCsv(content, author);
  }
}
