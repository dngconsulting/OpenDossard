import { gunzipSync, gzipSync } from 'node:zlib';

import type { GpxPoint, ParsedGpx } from './parse-gpx';
import { decodePolyline, decodeSeries, encodePolyline, encodeSeries } from './polyline';

/**
 * Stockage compact des points d'un GPX déposé, à la place du fichier
 * d'origine (contrainte de taille de base) : géométrie en polyline précision
 * 1e-6 (11 cm, écart maximal mesuré de 7 cm sur des coordonnées à 15
 * décimales) et altitudes du fichier au décimètre. Environ 4 fois plus petit
 * qu'un GPX compressé, et suffisant pour recalculer un tracé ou reconstruire
 * un GPX ; horodatages, points d'intérêt et extensions ne sont pas conservés.
 */

/** 1e-6 degré, soit environ 11 cm. */
const COORDINATE_FACTOR = 1e6;
/** Altitudes au décimètre. */
const ELEVATION_FACTOR = 10;

type StoredGpxPoints = {
  v: 1;
  name: string | null;
  polyline: string;
  /** Altitudes en deltas de décimètres (0 pour un point sans altitude), `null` sans aucune altitude. */
  ele: string | null;
  /** Index des points sans altitude, quand certains en ont. */
  missingEle?: number[];
};

export function encodeGpxPoints({ name, points }: ParsedGpx): Buffer {
  const missingEle = points.flatMap((p, i) => (p.ele == null ? [i] : []));
  const allMissing = missingEle.length === points.length;
  const stored: StoredGpxPoints = {
    v: 1,
    name,
    polyline: encodePolyline(
      points.map(p => [p.lon, p.lat]),
      COORDINATE_FACTOR,
    ),
    ele: allMissing
      ? null
      : encodeSeries(
          points.map(p => p.ele ?? 0),
          ELEVATION_FACTOR,
        ),
    ...(missingEle.length > 0 && !allMissing ? { missingEle } : {}),
  };
  return gzipSync(JSON.stringify(stored));
}

export function decodeGpxPoints(gzip: Buffer): ParsedGpx {
  const stored = JSON.parse(gunzipSync(gzip).toString('utf-8')) as StoredGpxPoints;
  const coordinates = decodePolyline(stored.polyline, COORDINATE_FACTOR);
  const elevations = stored.ele ? decodeSeries(stored.ele, ELEVATION_FACTOR) : null;
  const missing = new Set(stored.missingEle ?? []);
  const points: GpxPoint[] = coordinates.map(([lon, lat], i) => ({
    lat,
    lon,
    ele: elevations && !missing.has(i) ? elevations[i] : null,
  }));
  return { name: stored.name, points };
}

const escapeXml = (text: string) =>
  text.replace(
    /[<>&'"]/g,
    c => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[c]};`,
  );

/** GPX 1.1 reconstruit à partir des points stockés (téléchargement depuis la webapp). */
export function toGpxXml({ name, points }: ParsedGpx): string {
  const trkpts = points
    .map(
      p =>
        `<trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}">` +
        (p.ele != null ? `<ele>${p.ele.toFixed(1)}</ele>` : '') +
        '</trkpt>',
    )
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<gpx version="1.1" creator="OpenDossard" xmlns="http://www.topografix.com/GPX/1/1">\n' +
    `<trk>${name ? `<name>${escapeXml(name)}</name>` : ''}<trkseg>\n${trkpts}\n</trkseg></trk>\n</gpx>\n`
  );
}
