import type { ElevationSource } from './entities/competition-gpx-trace.entity';
import type { ParsedGpx } from './gpx/parse-gpx';
import { encodePolyline, encodeSeries, POLYLINE_FACTOR } from './gpx/polyline';
import {
  gpxElevationsAt,
  profileSamples,
  smoothProfile,
  gpxTraceGeometry,
  gpxTraceStats,
  type ProfileSamples,
  type GpxTraceGeometry,
  type GpxTraceStats,
} from './gpx/gpx-trace-profile';

/** Facteur des séries du profil : décimètre pour les distances et les altitudes. */
export const PROFILE_FACTOR = 10;

/**
 * Tracé prêt à afficher, servi aux apps (JSON gzip). Version incrémentée à
 * chaque changement de format.
 *
 * Les coordonnées sont arrondies à 1e-5° AVANT le calcul des distances : l'app
 * décode la polyline et retrouve exactement les mêmes distances avec la même
 * formule, sans qu'on les transmette.
 */
export type GpxTracePayload = {
  v: 1;
  name: string | null;
  /** Sommets du tracé, polyline Google précision 5. */
  polyline: string;
  /** Profil lissé : distances et altitudes en deltas de décimètres ; `null` sans altitude. */
  profile: { d: string; e: string } | null;
  stats: GpxTraceStats;
  elevationSource: ElevationSource;
};

export type PreparedGpxTrace = {
  parsed: ParsedGpx;
  geometry: GpxTraceGeometry;
  samples: ProfileSamples;
};

const roundCoordinate = (value: number) => Math.round(value * POLYLINE_FACTOR) / POLYLINE_FACTOR;

/** Géométrie sur coordonnées arrondies et positions où relever l'altitude. */
export function prepareGpxTrace(parsed: ParsedGpx): PreparedGpxTrace {
  const rounded = parsed.points.map(p => ({
    ...p,
    lat: roundCoordinate(p.lat),
    lon: roundCoordinate(p.lon),
  }));
  const geometry = gpxTraceGeometry(rounded);
  return { parsed: { ...parsed, points: rounded }, geometry, samples: profileSamples(geometry) };
}

/**
 * Profil et statistiques à partir des altitudes de référence (IGN, `null`
 * hors couverture ou indisponible) complétées par celles du GPX.
 */
export function finalizeGpxTrace(
  { parsed, geometry, samples }: PreparedGpxTrace,
  referenceElevations: (number | null)[] | null,
): { payload: GpxTracePayload; elevationSource: ElevationSource; stats: GpxTraceStats } {
  const fromGpx = gpxElevationsAt(parsed.points, geometry, samples);
  const referenceCount = referenceElevations?.filter(e => e != null).length ?? 0;
  const raw = samples.distances.map((_, i) => referenceElevations?.[i] ?? fromGpx?.[i] ?? null);
  const elevations = smoothProfile(samples.distances, raw);

  const elevationSource: ElevationSource = !elevations
    ? 'none'
    : referenceCount >= samples.distances.length / 2
      ? 'ign'
      : 'gpx';
  const stats = gpxTraceStats(geometry.totalDistance, elevations);

  const payload: GpxTracePayload = {
    v: 1,
    name: parsed.name,
    polyline: encodePolyline(geometry.coordinates),
    profile: elevations
      ? {
          d: encodeSeries(samples.distances, PROFILE_FACTOR),
          e: encodeSeries(elevations, PROFILE_FACTOR),
        }
      : null,
    stats,
    elevationSource,
  };
  return { payload, elevationSource, stats };
}
