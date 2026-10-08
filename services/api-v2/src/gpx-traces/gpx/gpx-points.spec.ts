import { decodeGpxPoints, encodeGpxPoints, toGpxXml } from './gpx-points';
import { parseGpx } from './parse-gpx';

const points = [
  { lat: 43.1234567890123, lon: 1.98765432109876, ele: 152.37 },
  { lat: 43.1236, lon: 1.9878, ele: null },
  { lat: 43.12371, lon: 1.98791, ele: 153 },
];

describe('gpx-points', () => {
  it('round-trips points within 1e-6 degree and 5 cm, keeping missing elevations', () => {
    const decoded = decodeGpxPoints(encodeGpxPoints({ name: 'Boucle', points }));
    expect(decoded.name).toBe('Boucle');
    decoded.points.forEach((p, i) => {
      expect(Math.abs(p.lat - points[i].lat)).toBeLessThanOrEqual(5e-7);
      expect(Math.abs(p.lon - points[i].lon)).toBeLessThanOrEqual(5e-7);
    });
    expect(decoded.points[0].ele).toBeCloseTo(152.4, 5);
    expect(decoded.points[1].ele).toBeNull();
    expect(decoded.points[2].ele).toBe(153);
  });

  it('stores tracks without any elevation', () => {
    const decoded = decodeGpxPoints(
      encodeGpxPoints({ name: null, points: points.map(p => ({ ...p, ele: null })) }),
    );
    expect(decoded.points.every(p => p.ele === null)).toBe(true);
  });

  it('rebuilds a valid GPX, with an escaped name, that parses back to the same points', () => {
    const stored = decodeGpxPoints(encodeGpxPoints({ name: 'A & <B>', points }));
    const reparsed = parseGpx(toGpxXml(stored));
    expect(reparsed.name).toBe('A & <B>');
    expect(reparsed.points).toEqual(
      stored.points.map(p => ({ ...p, ele: p.ele == null ? null : Number(p.ele.toFixed(1)) })),
    );
  });
});
