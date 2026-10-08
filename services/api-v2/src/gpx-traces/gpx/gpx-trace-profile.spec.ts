import { GpxParseError, type GpxPoint } from './parse-gpx';
import {
  gpxElevationsAt,
  PROFILE_STEP,
  profileSamples,
  smoothProfile,
  gpxTraceGeometry,
  gpxTraceStats,
  MAX_DISTANCE,
} from './gpx-trace-profile';

/** Points alignés vers le nord, espacés de `spacingM` mètres. */
function line(
  count: number,
  spacingM: number,
  ele: (i: number) => number | null = () => 100,
): GpxPoint[] {
  const degPerM = 1 / 111_195;
  return Array.from({ length: count }, (_, i) => ({
    lat: 43 + i * spacingM * degPerM,
    lon: 1,
    ele: ele(i),
  }));
}

describe('gpxTraceGeometry', () => {
  it('computes cumulative distances along the track', () => {
    const geometry = gpxTraceGeometry(line(11, 100));
    expect(geometry.totalDistance).toBeCloseTo(1000, 0);
    expect(geometry.distances[5]).toBeCloseTo(500, 0);
  });

  it('rejects a track whose points are all at the same place', () => {
    expect(() =>
      gpxTraceGeometry([
        { lat: 43, lon: 1, ele: 1 },
        { lat: 43, lon: 1, ele: 1 },
      ]),
    ).toThrow(GpxParseError);
  });

  it('rejects a track longer than the maximum distance, whatever its point count', () => {
    // Deux points aux antipodes : sans limite, des millions d'échantillons de profil.
    expect(() =>
      gpxTraceGeometry([
        { lat: -60, lon: -10, ele: 1 },
        { lat: 60, lon: 170, ele: 1 },
      ]),
    ).toThrow(`maximum ${MAX_DISTANCE / 1000} km`);
    expect(() => gpxTraceGeometry(line(2, MAX_DISTANCE - 1000))).not.toThrow();
  });
});

describe('profileSamples', () => {
  it('keeps every vertex and adds a sample every PROFILE_STEP metres on long segments', () => {
    const geometry = gpxTraceGeometry(line(2, 1000));
    const { distances } = profileSamples(geometry);
    expect(distances[0]).toBe(0);
    expect(distances[distances.length - 1]).toBeCloseTo(1000, 0);
    expect(distances).toHaveLength(1000 / PROFILE_STEP + 1);
  });

  it('is strictly increasing, with stacked vertices and vertices close to a regular sample', () => {
    // Sommets tous les 10 m (dont un sur chaque multiple de 50 m, proche d'un pas
    // régulier), puis 5 sommets superposés au même endroit.
    const end = line(40, 10)[39];
    const geometry = gpxTraceGeometry([
      ...line(40, 10),
      ...Array.from({ length: 5 }, () => ({ ...end })),
    ]);
    const { distances } = profileSamples(geometry);
    for (let i = 1; i < distances.length; i++)
      expect(distances[i]).toBeGreaterThan(distances[i - 1]);
    // 40 sommets + les pas réguliers qui ne tombent pas sur un sommet : 25, 75, … 375 m.
    expect(distances).toHaveLength(48);
  });

  it('places regular samples on the track', () => {
    const geometry = gpxTraceGeometry(line(2, 1000));
    const { coordinates } = profileSamples(geometry);
    for (const [lon] of coordinates) expect(lon).toBe(1);
  });
});

describe('gpxElevationsAt', () => {
  it('interpolates GPX elevations at sample distances', () => {
    const points = line(2, 1000, i => (i === 0 ? 100 : 200));
    const geometry = gpxTraceGeometry(points);
    const samples = profileSamples(geometry);
    const elevations = gpxElevationsAt(points, geometry, samples)!;
    expect(elevations[0]).toBe(100);
    expect(elevations[samples.distances.indexOf(500)]).toBeCloseTo(150, 3);
    expect(elevations[elevations.length - 1]).toBe(200);
  });

  it('returns null when most points have no elevation', () => {
    const points = line(4, 100, i => (i === 0 ? 100 : null));
    const geometry = gpxTraceGeometry(points);
    expect(gpxElevationsAt(points, geometry, profileSamples(geometry))).toBeNull();
  });
});

describe('smoothProfile', () => {
  it('fills gaps by interpolation and keeps a constant profile constant', () => {
    const distances = [0, 25, 50, 75, 100, 125];
    const result = smoothProfile(distances, [300, null, null, 300, 300, null])!;
    for (const e of result) expect(e).toBeCloseTo(300, 9);
  });

  it('returns null without any elevation', () => {
    expect(smoothProfile([0, 25], [null, null])).toBeNull();
  });
});

describe('gpxTraceStats', () => {
  it('sums climbs and descents, ignoring noise below the threshold', () => {
    const noisy = [100, 100.6, 100, 100.6, 100, 150, 150, 120];
    expect(gpxTraceStats(1000, noisy)).toEqual({
      distance: 1000,
      ascent: 50,
      descent: 30,
      minElevation: 100,
      maxElevation: 150,
    });
  });
});
