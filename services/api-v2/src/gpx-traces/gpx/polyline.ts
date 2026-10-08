/**
 * Encodage « polyline » (algorithme Google : entiers signés en zigzag, par
 * paquets de 5 bits, caractères décalés de 63). Sert aux coordonnées et aux
 * séries du profil, codées en deltas : des entiers petits, 1 à 3 caractères
 * par valeur, décodables en quelques lignes côté app.
 */

/** Précision 5 : 1e-5 degré, soit environ 1 m (tracé servi aux apps). */
export const POLYLINE_FACTOR = 1e5;

function encodeSigned(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  return out + String.fromCharCode(v + 63);
}

/** Lecteur séquentiel des entiers signés d'une chaîne encodée. */
function signedReader(encoded: string): { done: () => boolean; next: () => number } {
  let index = 0;
  return {
    done: () => index >= encoded.length,
    next: () => {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      return result & 1 ? ~(result >> 1) : result >> 1;
    },
  };
}

/** Série numérique codée en deltas, après multiplication par `factor` et arrondi. */
export function encodeSeries(values: number[], factor: number): string {
  let previous = 0;
  let out = '';
  for (const value of values) {
    const scaled = Math.round(value * factor);
    out += encodeSigned(scaled - previous);
    previous = scaled;
  }
  return out;
}

export function decodeSeries(encoded: string, factor: number): number[] {
  const reader = signedReader(encoded);
  const values: number[] = [];
  let current = 0;
  while (!reader.done()) {
    current += reader.next();
    values.push(current / factor);
  }
  return values;
}

/** Coordonnées `[lon, lat]` au format polyline Google (paires lat, lon), précision `factor`. */
export function encodePolyline(coordinates: [number, number][], factor = POLYLINE_FACTOR): string {
  let previousLat = 0;
  let previousLon = 0;
  let out = '';
  for (const [lon, lat] of coordinates) {
    const scaledLat = Math.round(lat * factor);
    const scaledLon = Math.round(lon * factor);
    out += encodeSigned(scaledLat - previousLat) + encodeSigned(scaledLon - previousLon);
    previousLat = scaledLat;
    previousLon = scaledLon;
  }
  return out;
}

export function decodePolyline(encoded: string, factor = POLYLINE_FACTOR): [number, number][] {
  const reader = signedReader(encoded);
  const coordinates: [number, number][] = [];
  let lat = 0;
  let lon = 0;
  while (!reader.done()) {
    lat += reader.next();
    lon += reader.next();
    coordinates.push([lon / factor, lat / factor]);
  }
  return coordinates;
}
