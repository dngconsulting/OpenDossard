import { gunzipSync, gzipSync } from 'node:zlib';

import type { ParsedGpx } from './parse-gpx';
import { encodePolyline, encodeSeries, iteratePolyline, iterateSeries } from './polyline';

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

export type StoredGpxPoints = {
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

const escapeXml = (text: string) =>
  text.replace(
    /[<>&'"]/g,
    c => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[c]};`,
  );

/** Points écrits par morceau de l'export : quelques dizaines de Ko par écriture. */
const POINTS_PER_CHUNK = 1000;

/**
 * Forme compacte stockée (~5 octets par point), décodée AVANT l'export : une
 * donnée illisible lève ici une erreur ordinaire (500), pas au milieu du flux.
 */
export function readGpxPoints(gzip: Buffer): StoredGpxPoints {
  return JSON.parse(gunzipSync(gzip).toString('utf-8')) as StoredGpxPoints;
}

/**
 * GPX 1.1 reconstruit à partir des points stockés, morceau par morceau : chaque
 * point est décodé puis écrit aussitôt, sans tableau de points ni document
 * complet en mémoire (un GPX de 200 000 points fait ~14 Mo).
 */
export function* gpxXmlChunks(stored: StoredGpxPoints): Generator<string> {
  yield '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<gpx version="1.1" creator="OpenDossard" xmlns="http://www.topografix.com/GPX/1/1">\n' +
    `<trk>${stored.name ? `<name>${escapeXml(stored.name)}</name>` : ''}<trkseg>\n`;

  const elevations = stored.ele ? iterateSeries(stored.ele, ELEVATION_FACTOR) : null;
  const missing = new Set(stored.missingEle ?? []);
  let chunk = '';
  let index = 0;
  for (const [lon, lat] of iteratePolyline(stored.polyline, COORDINATE_FACTOR)) {
    // La série d'altitudes a une valeur par point, même absente (0) : avancée à chaque point.
    const step = elevations?.next();
    const ele = step && !step.done ? step.value : null;
    chunk +=
      `<trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}">` +
      (ele != null && !missing.has(index) ? `<ele>${ele.toFixed(1)}</ele>` : '') +
      '</trkpt>\n';
    index++;
    if (index % POINTS_PER_CHUNK === 0) {
      yield chunk;
      chunk = '';
    }
  }
  yield `${chunk}</trkseg></trk>\n</gpx>\n`;
}

/**
 * `Content-Disposition` du GPX téléchargé, nommé d'après le parcours : nom
 * ASCII de repli (`filename`) et nom exact encodé (`filename*`, RFC 6266) pour
 * les accents. Sans nom de parcours : `parcours-<id de l'épreuve>.gpx`.
 */
export function gpxContentDisposition(name: string | null, competitionId: number): string {
  const fallback = `parcours-${competitionId}`;
  const ascii =
    (name ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/, '') || fallback;
  const exact = name?.trim()
    ? // `encodeURIComponent` laisse passer ' ( ) * !, interdits dans `filename*` (RFC 5987).
      `; filename*=UTF-8''${encodeURIComponent(`${name.trim()}.gpx`).replace(
        /['()*!]/g,
        c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
      )}`
    : '';
  return `attachment; filename="${ascii}.gpx"${exact}`;
}
