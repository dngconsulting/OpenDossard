import { gunzipSync } from 'node:zlib';

import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { Role } from '../common/enums';
import { GpxFileTooLargeFilter } from './gpx-file-too-large.filter';
import { MAX_GPX_BYTES, GpxTracesService, type GpxTraceSummary } from './gpx-traces.service';

/** Un tracé ne change qu'à un nouveau dépôt (nouvel id) : cache long côté app. */
const CONTENT_CACHE_CONTROL = 'private, max-age=86400';

@ApiTags('GPX traces')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('competitions/:competitionId/gpx-traces')
export class GpxTracesController {
  constructor(private readonly gpxTracesService: GpxTracesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_GPX_BYTES } }))
  @UseFilters(GpxFileTooLargeFilter)
  @ApiOperation({
    summary: 'Déposer le GPX d’un circuit',
    description:
      'Calcule le tracé (profil IGN, statistiques) et renvoie son résumé. Le circuit le ' +
      'référence ensuite par `competitionInfo[].gpxTraceId` (PATCH de l’épreuve), sans lien ' +
      '`info3` : un circuit a soit un lien, soit un GPX.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: 201, description: 'Tracé enregistré' })
  @ApiResponse({ status: 400, description: 'GPX absent ou inexploitable' })
  @ApiResponse({ status: 413, description: 'GPX trop volumineux' })
  upload(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GpxTraceSummary> {
    return this.gpxTracesService.upload(competitionId, file, user);
  }

  @Get(':gpxTraceId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: 'Tracé prêt à afficher (JSON compressé gzip, ETag)',
    description:
      '`{ v, name, polyline, profile: { d, e }, stats, elevationSource }` : polyline Google ' +
      'précision 5, profil en deltas de décimètres.',
  })
  @ApiResponse({ status: 200, description: 'Tracé' })
  @ApiResponse({ status: 304, description: 'Inchangé (If-None-Match)' })
  @ApiResponse({ status: 404, description: 'Tracé inconnu pour cette épreuve' })
  async content(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @Param('gpxTraceId', ParseUUIDPipe) gpxTraceId: string,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Headers('accept-encoding') acceptEncoding: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { gzip, etag, updatedAt } = await this.gpxTracesService.content(
      competitionId,
      gpxTraceId,
    );
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', updatedAt.toUTCString());
    res.setHeader('Cache-Control', CONTENT_CACHE_CONTROL);
    res.setHeader('Vary', 'Accept-Encoding');
    if (ifNoneMatch === etag) {
      res.status(HttpStatus.NOT_MODIFIED).end();
      return;
    }
    res.type('application/json');
    // Stocké compressé : servi tel quel (le middleware `compression` ne
    // recompresse pas une réponse qui a déjà un Content-Encoding).
    if (acceptEncoding?.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.send(gzip);
    } else {
      res.send(gunzipSync(gzip));
    }
  }

  @Get(':gpxTraceId/gpx')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Télécharger le GPX du circuit (reconstruit à partir des points stockés)',
  })
  @ApiResponse({ status: 200, description: 'Fichier GPX' })
  async gpxFile(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @Param('gpxTraceId', ParseUUIDPipe) gpxTraceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const gpx = await this.gpxTracesService.gpxFile(competitionId, gpxTraceId, user);
    res.type('application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="parcours-${competitionId}.gpx"`);
    res.send(gpx);
  }
}
