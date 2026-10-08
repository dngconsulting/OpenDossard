import { randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';

import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { CompetitionInfo } from '../common/types';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { CompetitionGpxTraceEntity } from './entities/competition-gpx-trace.entity';
import { decodeGpxPoints, encodeGpxPoints, toGpxXml } from './gpx/gpx-points';
import { GpxParseError, parseGpx, type ParsedGpx } from './gpx/parse-gpx';
import { IgnElevationService } from './ign-elevation.service';
import { finalizeGpxTrace, prepareGpxTrace, type PreparedGpxTrace } from './gpx-trace-payload';

/** Taille maximale d'un GPX déposé (un 600 km très détaillé fait ~3 Mo). */
export const MAX_GPX_BYTES = 10 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Un tracé déposé mais jamais rattaché à un circuit est supprimé après ce délai. */
const ORPHAN_GRACE_HOURS = 24;

/** Résumé d'un tracé, renvoyé à la webapp (jamais le contenu). */
export type GpxTraceSummary = Pick<
  CompetitionGpxTraceEntity,
  | 'id'
  | 'name'
  | 'distance'
  | 'ascent'
  | 'descent'
  | 'minElevation'
  | 'maxElevation'
  | 'pointCount'
  | 'elevationSource'
>;

/** Contenu servi aux apps : JSON déjà compressé et sa version (ETag). */
export type GpxTraceContent = { gzip: Buffer; etag: string; updatedAt: Date };

@Injectable()
export class GpxTracesService {
  private readonly logger = new Logger(GpxTracesService.name);

  constructor(
    @InjectRepository(CompetitionGpxTraceEntity)
    private readonly gpxTraceRepository: Repository<CompetitionGpxTraceEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    private readonly authorizationService: AuthorizationService,
    private readonly ignElevationService: IgnElevationService,
  ) {}

  /**
   * Dépôt d'un GPX par un organisateur (ou un admin) sur une épreuve : le tracé
   * est calculé (profil IGN, statistiques) et enregistré. Erreur 400 explicite
   * si le GPX est inexploitable ; l'IGN indisponible n'est pas une erreur
   * (altitudes du GPX).
   */
  async upload(
    competitionId: number,
    file: Express.Multer.File | undefined,
    user: AuthenticatedUser,
  ): Promise<GpxTraceSummary> {
    await this.assertCompetitionAccess(competitionId, user);
    // Taille maximale : limite de multer (`GpxFileTooLargeFilter` pour le message).
    if (!file?.buffer?.length) throw new BadRequestException('Aucun fichier GPX reçu.');

    let parsed: ParsedGpx;
    let prepared: PreparedGpxTrace;
    try {
      parsed = parseGpx(file.buffer.toString('utf-8').replace(/^\uFEFF/, ''));
      prepared = prepareGpxTrace(parsed);
    } catch (error) {
      if (error instanceof GpxParseError) throw new BadRequestException(error.message);
      throw error;
    }
    const reference = await this.ignElevationService.elevations(prepared.samples.coordinates);
    const { payload, stats, elevationSource } = finalizeGpxTrace(prepared, reference);

    const saved = await this.gpxTraceRepository.save(
      this.gpxTraceRepository.create({
        id: randomUUID(),
        competitionId,
        name: payload.name,
        gpxPointsGz: encodeGpxPoints(parsed),
        trackGz: gzipSync(JSON.stringify(payload)),
        distance: stats.distance,
        ascent: stats.ascent,
        descent: stats.descent,
        minElevation: stats.minElevation,
        maxElevation: stats.maxElevation,
        pointCount: prepared.geometry.coordinates.length,
        elevationSource,
      }),
    );
    this.logger.log(
      `Tracé ${saved.id} déposé (épreuve ${competitionId}) : ` +
        `${(stats.distance / 1000).toFixed(1)} km, D+ ${Math.round(stats.ascent)} m, altitudes ${elevationSource}`,
    );
    return this.toSummary(saved);
  }

  async content(competitionId: number, gpxTraceId: string): Promise<GpxTraceContent> {
    const gpxTrace = await this.gpxTraceRepository.findOne({
      where: { id: gpxTraceId, competitionId },
      select: { id: true, trackGz: true, updatedAt: true },
    });
    if (!gpxTrace)
      throw new NotFoundException(
        `Tracé ${gpxTraceId} introuvable pour l'épreuve ${competitionId}`,
      );
    return {
      gzip: gpxTrace.trackGz,
      etag: `"${gpxTrace.id}-${gpxTrace.updatedAt.getTime()}"`,
      updatedAt: gpxTrace.updatedAt,
    };
  }

  /** GPX reconstruit à partir des points stockés, pour le téléchargement depuis la webapp. */
  async gpxFile(
    competitionId: number,
    gpxTraceId: string,
    user: AuthenticatedUser,
  ): Promise<string> {
    await this.assertCompetitionAccess(competitionId, user);
    const gpxTrace = await this.gpxTraceRepository.findOne({
      where: { id: gpxTraceId, competitionId },
      select: { id: true, gpxPointsGz: true },
    });
    if (!gpxTrace)
      throw new NotFoundException(
        `Tracé ${gpxTraceId} introuvable pour l'épreuve ${competitionId}`,
      );
    return toGpxXml(decodeGpxPoints(gpxTrace.gpxPointsGz));
  }

  /**
   * Circuits prêts à enregistrer : le parcours d'un circuit est SOIT un lien
   * (`info3`, ouvert dans le navigateur), SOIT un GPX déposé sur l'épreuve
   * (`gpxTraceId`, affiché dans l'app), jamais les deux. Un lien vide est
   * retiré : l'app 4.1.9 affiche « Voir le tracé » dès que `info3` existe.
   * `competitionId` absent (création) : aucun GPX ne peut encore exister.
   */
  async validateCircuits(
    competitionId: number | undefined,
    circuits: unknown[],
  ): Promise<CompetitionInfo[]> {
    const normalized = circuits.map((circuit, index): CompetitionInfo => {
      // Corps non validé par un DTO : un circuit malformé est une 400, pas une 500.
      if (!circuit || typeof circuit !== 'object' || Array.isArray(circuit)) {
        throw new BadRequestException(`Circuit n° ${index + 1} invalide.`);
      }
      // Lien ou GPX vide = absent (clé retirée).
      const { info3, gpxTraceId, ...rest } = circuit as CompetitionInfo;
      const link = typeof info3 === 'string' ? info3.trim() : info3;
      return {
        ...rest,
        ...(link ? { info3: link } : {}),
        ...(gpxTraceId ? { gpxTraceId } : {}),
      };
    });
    const label = (circuit: CompetitionInfo, index: number) =>
      circuit.course ? `« ${circuit.course} »` : `n° ${index + 1}`;

    const withBoth = normalized.findIndex(circuit => circuit.gpxTraceId && circuit.info3);
    if (withBoth >= 0) {
      throw new BadRequestException(
        `Circuit ${label(normalized[withBoth], withBoth)} : choisir entre un lien de parcours et un fichier GPX.`,
      );
    }

    const withGpxTrace = normalized.flatMap((circuit, index) =>
      circuit.gpxTraceId ? [{ circuit, index, gpxTraceId: circuit.gpxTraceId }] : [],
    );
    if (withGpxTrace.length === 0) return normalized;
    // Un id mal formé ferait échouer la requête sur la colonne uuid (500) : traité comme inconnu.
    const wellFormed = [
      ...new Set(
        withGpxTrace.flatMap(({ gpxTraceId }) =>
          typeof gpxTraceId === 'string' && UUID.test(gpxTraceId) ? [gpxTraceId] : [],
        ),
      ),
    ];
    const known = new Set(
      competitionId == null || wellFormed.length === 0
        ? []
        : (
            await this.gpxTraceRepository.find({
              where: { competitionId, id: In(wellFormed) },
              select: { id: true },
            })
          ).map(gpxTrace => gpxTrace.id),
    );
    const missing = withGpxTrace.find(({ gpxTraceId }) => !known.has(gpxTraceId));
    if (missing) {
      // Cas réel : GPX déposé, formulaire laissé ouvert, tracé non rattaché purgé la nuit.
      throw new BadRequestException(
        `Circuit ${label(missing.circuit, missing.index)} : le fichier GPX n'existe plus, ` +
          'déposez-le à nouveau ou retirez-le.',
      );
    }
    return normalized;
  }

  /**
   * Copie des tracés d'une épreuve dupliquée, sous les nouveaux ids déjà
   * portés par les circuits de la copie (`originalId → copyId`).
   */
  async copyToCompetition(
    manager: EntityManager,
    fromCompetitionId: number,
    toCompetitionId: number,
    copies: Map<string, string>,
  ): Promise<void> {
    for (const [originalId, copyId] of copies) {
      await manager.query(
        `INSERT INTO "competition_gpx_trace" (
           "id", "competition_id", "name", "gpx_points_gz", "track_gz",
           "distance", "ascent", "descent", "min_elevation", "max_elevation",
           "point_count", "elevation_source")
         SELECT $1, $2, "name", "gpx_points_gz", "track_gz",
           "distance", "ascent", "descent", "min_elevation", "max_elevation",
           "point_count", "elevation_source"
         FROM "competition_gpx_trace" WHERE "id" = $3 AND "competition_id" = $4`,
        [copyId, toCompetitionId, originalId, fromCompetitionId],
      );
    }
  }

  /**
   * Supprime les tracés qu'aucun circuit de leur épreuve ne référence plus
   * (remplacés, retirés, ou déposés sans que l'épreuve soit enregistrée),
   * passé un délai de grâce : un dépôt en cours d'édition n'est jamais touché.
   */
  @Cron('30 4 * * *', { name: 'competition-gpx-traces-orphans' })
  async purgeOrphans(): Promise<number> {
    const result: unknown = await this.gpxTraceRepository.query(
      `DELETE FROM "competition_gpx_trace" t
       USING "competition" c
       WHERE c.id = t.competition_id
         AND t.created_at < now() - ($1 || ' hours')::interval
         AND NOT EXISTS (
           SELECT 1 FROM json_array_elements(COALESCE(c.competition_info, '[]'::json)) AS info(value)
           WHERE info.value->>'gpxTraceId' = t.id::text
         )`,
      [String(ORPHAN_GRACE_HOURS)],
    );
    const deleted = Array.isArray(result) && typeof result[1] === 'number' ? result[1] : 0;
    if (deleted > 0) this.logger.log(`${deleted} tracé(s) orphelin(s) supprimé(s)`);
    return deleted;
  }

  private async assertCompetitionAccess(
    competitionId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    const competition = await this.competitionRepository.findOne({
      where: { id: competitionId },
      select: { id: true, clubId: true },
    });
    if (!competition) throw new NotFoundException(`Competition with ID ${competitionId} not found`);
    await this.authorizationService.assertCompetitionAccess(user, competition);
  }

  private toSummary(gpxTrace: CompetitionGpxTraceEntity): GpxTraceSummary {
    return {
      id: gpxTrace.id,
      name: gpxTrace.name,
      distance: gpxTrace.distance,
      ascent: gpxTrace.ascent,
      descent: gpxTrace.descent,
      minElevation: gpxTrace.minElevation,
      maxElevation: gpxTrace.maxElevation,
      pointCount: gpxTrace.pointCount,
      elevationSource: gpxTrace.elevationSource,
    };
  }
}
