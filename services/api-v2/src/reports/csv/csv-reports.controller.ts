import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '../../common/enums';
import { FilterLicenceDto } from '../../licences/dto';
import { CsvReportsService } from './csv-reports.service';

@ApiTags('CSV Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/csv')
export class CsvReportsController {
  constructor(private readonly csvReportsService: CsvReportsService) {}

  @Get('licences')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Export filtered licences as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportLicencesCSV(
    @Query() filterDto: FilterLicenceDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvBuffer = await this.csvReportsService.generateLicencesCSV(filterDto);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="licences - ${date}.csv"`,
      'Content-Length': csvBuffer.length,
    });
    res.end(csvBuffer);
  }
}
