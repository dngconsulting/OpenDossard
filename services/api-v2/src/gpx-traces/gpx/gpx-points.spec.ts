import { encodeGpxPoints, gpxContentDisposition, gpxXmlChunks, readGpxPoints } from './gpx-points';
import { parseGpx } from './parse-gpx';

const points = [
  { lat: 43.1234567890123, lon: 1.98765432109876, ele: 152.37 },
  { lat: 43.1236, lon: 1.9878, ele: null },
  { lat: 43.12371, lon: 1.98791, ele: 153 },
];

/** GPX exporté en flux, recomposé puis relu. */
const exported = (name: string | null, pts = points) =>
  parseGpx([...gpxXmlChunks(readGpxPoints(encodeGpxPoints({ name, points: pts })))].join(''));

describe('gpx-points', () => {
  it('exports points within 1e-6 degree and 5 cm, keeping missing elevations', () => {
    const gpx = exported('Boucle');
    expect(gpx.name).toBe('Boucle');
    gpx.points.forEach((p, i) => {
      expect(Math.abs(p.lat - points[i].lat)).toBeLessThanOrEqual(5e-7);
      expect(Math.abs(p.lon - points[i].lon)).toBeLessThanOrEqual(5e-7);
    });
    expect(gpx.points.map(p => p.ele)).toEqual([152.4, null, 153]);
  });

  it('exports tracks without any elevation, and escapes the name', () => {
    const gpx = exported(
      'A & <B>',
      points.map(p => ({ ...p, ele: null })),
    );
    expect(gpx.name).toBe('A & <B>');
    expect(gpx.points.every(p => p.ele === null)).toBe(true);
  });

  it('streams large tracks in chunks, never as a single document', () => {
    const count = 2500;
    const many = Array.from({ length: count }, (_, i) => ({
      lat: 43 + i * 1e-4,
      lon: 1,
      ele: i % 7 === 0 ? null : 100 + i / 10,
    }));
    const chunks = [...gpxXmlChunks(readGpxPoints(encodeGpxPoints({ name: null, points: many })))];
    // En-tête, 2 morceaux de 1 000 points, reste + pied de document.
    expect(chunks).toHaveLength(4);
    const gpx = parseGpx(chunks.join(''));
    expect(gpx.points).toHaveLength(count);
    expect(gpx.points[7].ele).toBeNull();
    expect(gpx.points[2498].ele).toBeCloseTo(349.8, 5);
  });

  it('rejects unreadable stored points before any byte is streamed', () => {
    expect(() => readGpxPoints(Buffer.from('pas du gzip'))).toThrow();
  });
});

describe('gpxContentDisposition', () => {
  it('names the file after the route, ASCII fallback plus exact encoded name', () => {
    expect(gpxContentDisposition('Boucle des Côteaux — 92 km', 12)).toBe(
      'attachment; filename="boucle-des-coteaux-92-km.gpx"; ' +
        "filename*=UTF-8''Boucle%20des%20C%C3%B4teaux%20%E2%80%94%2092%20km.gpx",
    );
  });

  it('encodes the characters forbidden in filename*, such as the apostrophe', () => {
    expect(gpxContentDisposition("L'Ariégeoise (court)", 12)).toBe(
      'attachment; filename="l-ariegeoise-court.gpx"; ' +
        "filename*=UTF-8''L%27Ari%C3%A9geoise%20%28court%29.gpx",
    );
  });

  it('falls back to the competition id without a usable name', () => {
    expect(gpxContentDisposition(null, 12)).toBe('attachment; filename="parcours-12.gpx"');
    expect(gpxContentDisposition('— ', 12)).toBe(
      'attachment; filename="parcours-12.gpx"; filename*=UTF-8\'\'%E2%80%94.gpx',
    );
  });
});
