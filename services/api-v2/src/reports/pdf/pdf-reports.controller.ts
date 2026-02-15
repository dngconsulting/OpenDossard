import { Controller, Get, Header, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '../../common/enums';
import { FilterLicenceDto } from '../../licences/dto';
import { PdfReportsService } from './pdf-reports.service';

@ApiTags('PDF Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/pdf')
export class PdfReportsController {
  constructor(private readonly pdfReportsService: PdfReportsService) {}

  @Get('fiche-epreuve/:id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Generate fiche épreuve PDF for a competition' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async exportFicheEpreuve(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.pdfReportsService.generateFicheEpreuve(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fiche_epreuve_${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('licences')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Export filtered licences as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  async exportLicencesPDF(
    @Query() filterDto: FilterLicenceDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.pdfReportsService.generateLicencesPDF(filterDto);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Licences.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
