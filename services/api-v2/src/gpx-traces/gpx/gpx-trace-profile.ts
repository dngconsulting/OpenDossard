import { GpxParseError, type GpxPoint } from './parse-gpx';

/**
 * Géométrie et profil altimétrique d'un tracé, calculés une fois à
 * l'enregistrement et servis tels quels aux apps (aucun calcul côté mobile).
 *
 * Le profil est échantillonné aux sommets du GPX ET tous les `PROFILE_STEP`
 * mètres : les sommets, denses dans les lacets, captent les virages ; le pas
 * régulier couvre les longues lignes droites, où un GPX peut rester plus d'un
 * kilomètre sans point (mesuré sur des parcours OpenRunner réels).
 */

export type LonLat = [number, number];

export type GpxTraceGeometry = {
  coordinates: LonLat[];
  /** Distance cumulée (m) de chaque sommet depuis le départ. */
  distances: number[];
  totalDistance: number;
};

/** Points où l'altitude est relevée, triés par distance. */
export type ProfileSamples = {
  distances: number[];
  coordinates: LonLat[];
};

export type GpxTraceStats = {
  distance: number;
  ascent: number;
  descent: number;
  minElevation: number;
  maxElevation: number;
};

const EARTH_RADIUS = 6371008.8;
const DEG_TO_RAD = Math.PI / 180;
export const PROFILE_STEP = 25;
/** Un échantillon régulier à moins d'1 m d'un sommet ferait doublon. */
const SAMPLE_MERGE_DISTANCE = 1;
/** Fenêtre (m) de la moyenne glissante : absorbe le bruit du MNT et du GPS. */
const SMOOTHING_WINDOW = 100;
/**
 * Variation minimale (m) comptée dans le D+/D−, après lissage. Mesuré sur des
 * profils IGN de parcours réels (2026-10-08) : 1 m donne −1,2 % et +1,8 %
 * d'écart avec les D+ affichés par OpenRunner ; 2 m sous-estime de 4 à 6 %,
 * et sans seuil le bruit résiduel gonfle le D+ de 7 à 16 %.
 */
const ELEVATION_THRESHOLD = 1;
export const MAX_POINTS = 200_000;
/**
 * Distance maximale (m) : le profil est échantillonné tous les `PROFILE_STEP`
 * mètres, la limite de points ne suffit donc pas (quelques points aux
 * antipodes donneraient des millions d'échantillons et d'appels IGN). Large
 * au-dessus des plus longues épreuves (Paris-Brest-Paris : 1 200 km).
 */
export const MAX_DISTANCE = 2_000_000;

function haversine(a: LonLat, b: LonLat): number {
  const dLat = (b[1] - a[1]) * DEG_TO_RAD;
  const dLon = (b[0] - a[0]) * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * DEG_TO_RAD) * Math.cos(b[1] * DEG_TO_RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

export function gpxTraceGeometry(points: GpxPoint[]): GpxTraceGeometry {
  if (points.length > MAX_POINTS) {
    throw new GpxParseError(
      `Tracé trop détaillé (${points.length} points, maximum ${MAX_POINTS}).`,
    );
  }
  const coordinates = points.map((p): LonLat => [p.lon, p.lat]);
  const distances = new Array<number>(coordinates.length);
  distances[0] = 0;
  for (let i = 1; i < coordinates.length; i++) {
    distances[i] = distances[i - 1] + haversine(coordinates[i - 1], coordinates[i]);
  }
  const totalDistance = distances[distances.length - 1];
  if (!(totalDistance >= 1)) {
    throw new GpxParseError('Le tracé est vide : tous ses points sont au même endroit.');
  }
  if (totalDistance > MAX_DISTANCE) {
    throw new GpxParseError(
      `Parcours trop long (${Math.round(totalDistance / 1000)} km, maximum ${MAX_DISTANCE / 1000} km).`,
    );
  }
  return { coordinates, distances, totalDistance };
}

/** Sommets ∪ multiples de `PROFILE_STEP`, positions interpolées sur le tracé. */
export function profileSamples({ coordinates, distances }: GpxTraceGeometry): ProfileSamples {
  const sampleDistances: number[] = [];
  const sampleCoordinates: LonLat[] = [];
  let regular = PROFILE_STEP;
  let segment = 0;
  for (let i = 0; i < coordinates.length; i++) {
    // Échantillons réguliers situés avant ce sommet, interpolés sur leur segment.
    while (regular < distances[i] - SAMPLE_MERGE_DISTANCE) {
      while (distances[segment + 1] < regular) segment++;
      const t = (regular - distances[segment]) / (distances[segment + 1] - distances[segment]);
      const [lon1, lat1] = coordinates[segment];
      const [lon2, lat2] = coordinates[segment + 1];
      sampleDistances.push(regular);
      sampleCoordinates.push([lon1 + t * (lon2 - lon1), lat1 + t * (lat2 - lat1)]);
      regular += PROFILE_STEP;
    }
    // Échantillon régulier confondu avec ce sommet : le sommet suffit.
    if (regular <= distances[i] + SAMPLE_MERGE_DISTANCE) regular += PROFILE_STEP;
    // Sommets superposés (même distance) : un seul échantillon.
    const last = sampleDistances[sampleDistances.length - 1];
    if (last === undefined || distances[i] > last) {
      sampleDistances.push(distances[i]);
      sampleCoordinates.push(coordinates[i]);
    }
  }
  return { distances: sampleDistances, coordinates: sampleCoordinates };
}

/**
 * Altitudes du GPX interpolées aux échantillons (secours hors couverture IGN).
 * `null` si moins de la moitié des sommets ont une altitude.
 */
export function gpxElevationsAt(
  points: GpxPoint[],
  geometry: GpxTraceGeometry,
  samples: ProfileSamples,
): (number | null)[] | null {
  const known: { d: number; e: number }[] = [];
  points.forEach((p, i) => {
    if (p.ele != null) known.push({ d: geometry.distances[i], e: p.ele });
  });
  if (known.length < points.length / 2) return null;
  let k = 0;
  return samples.distances.map(d => {
    while (k < known.length - 2 && known[k + 1].d < d) k++;
    const a = known[k];
    const b = known[Math.min(k + 1, known.length - 1)];
    if (d <= a.d || b.d === a.d) return a.e;
    if (d >= b.d) return b.e;
    return a.e + ((d - a.d) / (b.d - a.d)) * (b.e - a.e);
  });
}

/**
 * Profil final : altitude de référence par échantillon (IGN si connue, sinon
 * GPX), trous comblés par interpolation, puis moyenne glissante. `null` sans
 * aucune altitude.
 */
export function smoothProfile(distances: number[], raw: (number | null)[]): number[] | null {
  const knownIndex = raw.flatMap((e, i) => (e == null ? [] : [i]));
  if (knownIndex.length === 0) return null;
  const filled = raw.slice() as number[];
  let previous = -1;
  for (const i of knownIndex) {
    for (let j = previous + 1; j < i; j++) {
      filled[j] =
        previous < 0
          ? (raw[i] as number)
          : (raw[previous] as number) +
            ((distances[j] - distances[previous]) / (distances[i] - distances[previous])) *
              ((raw[i] as number) - (raw[previous] as number));
    }
    previous = i;
  }
  for (let j = previous + 1; j < raw.length; j++) filled[j] = raw[previous] as number;

  // Moyenne glissante sur une fenêtre en distance (deux curseurs, O(n)).
  const half = SMOOTHING_WINDOW / 2;
  const smoothed = new Array<number>(filled.length);
  let start = 0;
  let end = 0;
  let sum = 0;
  for (let i = 0; i < filled.length; i++) {
    while (end < filled.length && distances[end] <= distances[i] + half) sum += filled[end++];
    while (distances[start] < distances[i] - half) sum -= filled[start++];
    smoothed[i] = sum / (end - start);
  }
  return smoothed;
}

export function gpxTraceStats(totalDistance: number, elevations: number[] | null): GpxTraceStats {
  if (!elevations) {
    return { distance: totalDistance, ascent: 0, descent: 0, minElevation: 0, maxElevation: 0 };
  }
  let ascent = 0;
  let descent = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  let reference = elevations[0];
  for (const ele of elevations) {
    if (ele < minElevation) minElevation = ele;
    if (ele > maxElevation) maxElevation = ele;
    const delta = ele - reference;
    if (delta >= ELEVATION_THRESHOLD) {
      ascent += delta;
      reference = ele;
    } else if (delta <= -ELEVATION_THRESHOLD) {
      descent -= delta;
      reference = ele;
    }
  }
  return { distance: totalDistance, ascent, descent, minElevation, maxElevation };
}
