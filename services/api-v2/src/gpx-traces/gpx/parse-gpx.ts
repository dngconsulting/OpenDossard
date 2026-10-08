/**
 * Lecture d'un fichier GPX : points du tracé (`trkpt`, ou `rtept` à défaut) et
 * nom du parcours. Parcours linéaire du texte par `indexOf` : coût
 * proportionnel à la taille du fichier, sans regex sur le document entier
 * (une regex à quantificateur paresseux par point devient quadratique sur les
 * gros fichiers).
 */

export type GpxPoint = {
  lat: number;
  lon: number;
  /** `null` si le point n'a pas d'altitude exploitable. */
  ele: number | null;
};

export type ParsedGpx = {
  name: string | null;
  points: GpxPoint[];
};

export class GpxParseError extends Error {}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** Entités XML nommées et numériques (`&#039;`, `&#x27;`, fréquentes dans les exports). */
export function decodeXmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

/** Valeur d'un attribut dans le texte d'une balise ouvrante (texte court, regex sûre). */
function attribute(tag: string, name: string): number {
  const match = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`).exec(tag);
  return match ? Number(match[1]) : NaN;
}

/**
 * Texte de la première balise `<tag>` de `xml[from, to)`. La recherche reste
 * bornée à cet intervalle : un `indexOf` sur tout le reste du document, répété
 * pour chaque point sans `<ele>`, rendrait la lecture quadratique (déni de
 * service avec un fichier de quelques Mo).
 */
function textOf(xml: string, tag: string, from: number, to: number): string | null {
  const range = xml.slice(from, to);
  const open = range.indexOf(`<${tag}>`);
  if (open < 0) return null;
  const start = open + tag.length + 2;
  const close = range.indexOf(`</${tag}>`, start);
  if (close < 0) return null;
  let text = range.slice(start, close).trim();
  if (text.startsWith('<![CDATA[') && text.endsWith(']]>')) text = text.slice(9, -3).trim();
  return text;
}

function readPoints(xml: string, tag: 'trkpt' | 'rtept'): GpxPoint[] {
  const points: GpxPoint[] = [];
  const openTag = `<${tag}`;
  const closeTag = `</${tag}>`;
  let cursor = xml.indexOf(openTag);
  while (cursor >= 0) {
    const tagEnd = xml.indexOf('>', cursor);
    if (tagEnd < 0) break;
    const head = xml.slice(cursor, tagEnd + 1);
    const selfClosing = head.endsWith('/>');
    let next = tagEnd + 1;
    let ele: number | null = null;
    if (!selfClosing) {
      const close = xml.indexOf(closeTag, next);
      const end = close < 0 ? xml.length : close;
      const eleText = textOf(xml, 'ele', next, end);
      // `<ele> </ele>` : altitude absente, pas 0 m.
      const value = eleText ? Number(eleText) : NaN;
      ele = Number.isFinite(value) ? value : null;
      next = close < 0 ? end : close + closeTag.length;
    }
    const lat = attribute(head, 'lat');
    const lon = attribute(head, 'lon');
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180
    ) {
      points.push({ lat, lon, ele });
    }
    cursor = xml.indexOf(openTag, next);
  }
  return points;
}

/**
 * Nom du parcours : celui du `<trk>`/`<rte>` (placé avant ses points), sinon
 * celui des `<metadata>`. Jamais celui d'un waypoint.
 */
function readName(xml: string): string | null {
  const candidates: [number, number][] = [];
  const track = Math.min(
    ...['<trk>', '<trk ', '<rte>', '<rte '].map(t => xml.indexOf(t)).filter(i => i >= 0),
  );
  if (Number.isFinite(track)) {
    const points = Math.min(
      ...['<trkseg', '<rtept'].map(t => xml.indexOf(t, track)).filter(i => i >= 0),
    );
    candidates.push([track, Number.isFinite(points) ? points : xml.length]);
  }
  const metadata = xml.indexOf('<metadata');
  if (metadata >= 0) {
    const end = xml.indexOf('</metadata>', metadata);
    candidates.push([metadata, end < 0 ? xml.length : end]);
  }
  for (const [from, to] of candidates) {
    const name = textOf(xml, 'name', from, to);
    if (name) return decodeXmlEntities(name);
  }
  return null;
}

export function parseGpx(xml: string): ParsedGpx {
  let points = readPoints(xml, 'trkpt');
  if (points.length < 2) points = readPoints(xml, 'rtept');
  if (points.length < 2) {
    throw new GpxParseError(
      'Le fichier GPX ne contient pas de tracé exploitable (moins de 2 points).',
    );
  }
  return { name: readName(xml), points };
}
