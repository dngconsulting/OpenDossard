import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import type { CompetitionInfo } from '../src/common/types';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { parseGpx } from '../src/gpx-traces/gpx/parse-gpx';
import { decodePolyline, decodeSeries } from '../src/gpx-traces/gpx/polyline';
import { PROFILE_FACTOR, type GpxTracePayload } from '../src/gpx-traces/gpx-trace-payload';
import { GpxTracesService } from '../src/gpx-traces/gpx-traces.service';

/**
 * Tracés GPX des circuits : dépôt (ORGA du club / ADMIN), lecture (+ MOBILE),
 * circuit à lien OU à GPX, ménage des orphelins, copie à la duplication d'épreuve.
 *
 * L'altimétrie IGN est simulée (fetch intercepté) : aucune requête réseau.
 */
const ORGA_USER_ID = 2;

type UploadedGpxTrace = { id: string; distance: number; ascent: number; elevationSource: string };
const IGN_URL = 'data.geopf.fr/altimetrie';

/** GPX d'une ligne droite vers le nord de `km` kilomètres, 1 point / 100 m, qui monte. */
function lineGpx(km: number, name = 'Boucle test'): Buffer {
  const count = km * 10 + 1;
  const points = Array.from(
    { length: count },
    (_, i) =>
      `<trkpt lat="${(43 + (i * 100) / 111_195).toFixed(6)}" lon="1.000000"><ele>${100 + i}</ele></trkpt>`,
  ).join('');
  return Buffer.from(
    `<?xml version="1.0"?><gpx><trk><name>${name}</name><trkseg>${points}</trkseg></trk></gpx>`,
  );
}

/** Altitude IGN simulée : 5 m au-dessus d'une pente de 10 m / km depuis 43° N. */
function fakeIgnElevation(lat: number): number {
  return 205 + (lat - 43) * 111_195 * 0.01;
}

describe('Traces (e2e)', () => {
  let competitions: CompetitionEntity[];
  let clubs: ClubEntity[];
  let ignAvailable = true;
  const realFetch = globalThis.fetch;

  beforeAll(() => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes(IGN_URL)) return realFetch(input, init);
      if (!ignAvailable) throw new Error('IGN injoignable');
      const body = JSON.parse(init?.body as string) as { lat: string };
      const elevations = body.lat.split('|').map(lat => fakeIgnElevation(Number(lat)));
      return new Response(JSON.stringify({ elevations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    ignAvailable = true;
    clubs = await getSeedHelper().seedClubs();
    competitions = await getSeedHelper().seedCompetitions(clubs);
    await getSeedHelper().seedUserClubs([{ userId: ORGA_USER_ID, clubId: clubs[0].id }]);
  });

  afterEach(async () => {
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanUserClubs();
    await getSeedHelper().cleanClubs();
  });

  const server = () => getApp().getHttpServer();
  const orga = () => getAuthHelper().getOrgaToken();
  const mobile = () => getAuthHelper().getMobileToken();
  const base = (competitionId: number) => `/api/v2/competitions/${competitionId}/gpx-traces`;

  const upload = (competitionId: number, gpx: Buffer, token = orga()) =>
    request(server())
      .post(base(competitionId))
      .set('Authorization', `Bearer ${token}`)
      .attach('file', gpx, 'gpx-trace.gpx');

  const setCircuitGpxTrace = async (competition: CompetitionEntity, gpxTraceId: string) => {
    const repo = getApp().get(DataSource).getRepository(CompetitionEntity);
    competition.competitionInfo = [{ course: '20 km', gpxTraceId }];
    await repo.save(competition);
  };

  describe('POST /competitions/:id/gpx-traces', () => {
    it('stores the GPX trace and returns its summary, with IGN elevations', async () => {
      const res = await upload(competitions[0].id, lineGpx(2)).expect(201);
      const summary = res.body as {
        id: string;
        distance: number;
        ascent: number;
        elevationSource: string;
      };

      expect(summary.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(summary.distance).toBeCloseTo(2000, -1);
      expect(summary.elevationSource).toBe('ign');
      // Pente IGN simulée de 10 m/km sur 2 km.
      expect(summary.ascent).toBeGreaterThan(15);
      expect(summary.ascent).toBeLessThan(25);
    });

    it('falls back to GPX elevations when IGN is unavailable', async () => {
      ignAvailable = false;
      const res = await upload(competitions[0].id, lineGpx(2)).expect(201);
      expect((res.body as UploadedGpxTrace).elevationSource).toBe('gpx');
    });

    it('rejects a GPX over 10 MB with a French message', async () => {
      const res = await upload(competitions[0].id, Buffer.alloc(10 * 1024 * 1024 + 1, 'a')).expect(
        413,
      );
      expect((res.body as { message: string }).message).toBe(
        'Fichier GPX trop volumineux (10 Mo maximum).',
      );
    });

    it('rejects an organiser from another club and the MOBILE role', async () => {
      await upload(competitions[1].id, lineGpx(1)).expect(403);
      await upload(competitions[0].id, lineGpx(1), mobile()).expect(403);
    });

    it('rejects a missing or unusable GPX with an explicit message', async () => {
      await request(server())
        .post(base(competitions[0].id))
        .set('Authorization', `Bearer ${orga()}`)
        .expect(400);
      const res = await upload(competitions[0].id, Buffer.from('<gpx></gpx>')).expect(400);
      expect((res.body as { message: string }).message).toContain('tracé exploitable');
    });
  });

  describe('GET /competitions/:id/gpx-traces/:gpxTraceId', () => {
    it('serves the gzip payload with an ETag, and 304 when unchanged', async () => {
      const gpxTrace = (
        await upload(competitions[0].id, lineGpx(2, 'Boucle d&#039;essai')).expect(201)
      ).body as UploadedGpxTrace;
      const gpxTraceId = gpxTrace.id;

      const res = await request(server())
        .get(`${base(competitions[0].id)}/${gpxTraceId}`)
        .set('Authorization', `Bearer ${mobile()}`)
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      expect(res.headers['content-encoding']).toBe('gzip');
      expect(res.headers['cache-control']).toBe('private, max-age=86400');
      const payload = res.body as GpxTracePayload;
      expect(payload.v).toBe(1);
      expect(payload.name).toBe("Boucle d'essai");
      expect(decodePolyline(payload.polyline)).toHaveLength(21);
      const distances = decodeSeries(payload.profile!.d, PROFILE_FACTOR);
      const elevations = decodeSeries(payload.profile!.e, PROFILE_FACTOR);
      expect(distances).toHaveLength(elevations.length);
      expect(distances[distances.length - 1]).toBeCloseTo(2000, -1);

      await request(server())
        .get(`${base(competitions[0].id)}/${gpxTraceId}`)
        .set('Authorization', `Bearer ${mobile()}`)
        .set('If-None-Match', String(res.headers['etag']))
        .expect(304);
    });

    it('returns 404 for a GPX trace of another competition', async () => {
      const gpxTrace = (await upload(competitions[0].id, lineGpx(1)).expect(201))
        .body as UploadedGpxTrace;
      await request(server())
        .get(`${base(competitions[2].id)}/${gpxTrace.id}`)
        .set('Authorization', `Bearer ${mobile()}`)
        .expect(404);
    });

    it('returns the GPX rebuilt from the stored points to the organiser', async () => {
      const gpx = lineGpx(1, 'Original');
      const gpxTrace = (await upload(competitions[0].id, gpx).expect(201)).body as UploadedGpxTrace;
      const res = await request(server())
        .get(`${base(competitions[0].id)}/${gpxTrace.id}/gpx`)
        .set('Authorization', `Bearer ${orga()}`)
        .expect('Content-Type', /gpx/)
        .expect('Content-Disposition', /parcours-\d+\.gpx/)
        .expect(200);

      const original = parseGpx(gpx.toString('utf-8'));
      const rebuilt = parseGpx(res.text);
      expect(rebuilt.name).toBe('Original');
      expect(rebuilt.points).toHaveLength(original.points.length);
      rebuilt.points.forEach((point, i) => {
        expect(point.lat).toBeCloseTo(original.points[i].lat, 6);
        expect(point.lon).toBeCloseTo(original.points[i].lon, 6);
        expect(point.ele).toBe(original.points[i].ele);
      });
    });
  });

  describe('circuits: link OR GPX trace', () => {
    const patchCircuits = (competitionId: number, competitionInfo: CompetitionInfo[]) =>
      request(server())
        .patch(`/api/v2/competitions/${competitionId}`)
        .set('Authorization', `Bearer ${orga()}`)
        .send({ competitionInfo });

    const storedCircuits = async (competitionId: number) =>
      (
        await getApp()
          .get(DataSource)
          .getRepository(CompetitionEntity)
          .findOneByOrFail({ id: competitionId })
      ).competitionInfo;

    it('rejects a circuit with both a link and a GPX trace', async () => {
      const { id: gpxTraceId } = (await upload(competitions[0].id, lineGpx(1)).expect(201))
        .body as UploadedGpxTrace;
      const res = await patchCircuits(competitions[0].id, [
        { course: '60 km', info3: 'https://www.openrunner.com/r/1', gpxTraceId },
      ]).expect(400);
      expect((res.body as { message: string }).message).toContain('60 km');
    });

    it('rejects a malformed or vanished GPX trace with a message naming the circuit', async () => {
      const malformed = await patchCircuits(competitions[0].id, [
        { course: '60 km', gpxTraceId: 'abc' },
      ]).expect(400);
      expect((malformed.body as { message: string }).message).toBe(
        "Circuit « 60 km » : le fichier GPX n'existe plus, déposez-le à nouveau ou retirez-le.",
      );

      // Déposé puis purgé avant l'enregistrement de l'épreuve.
      const { id: gpxTraceId } = (await upload(competitions[0].id, lineGpx(1)).expect(201))
        .body as UploadedGpxTrace;
      await getApp()
        .get(DataSource)
        .query(`DELETE FROM competition_gpx_trace WHERE id = $1`, [gpxTraceId]);
      await patchCircuits(competitions[0].id, [{ course: '90 km', gpxTraceId }]).expect(400);
    });

    it('rejects a malformed circuit, and treats an empty GPX trace id as no GPX', async () => {
      await patchCircuits(competitions[0].id, [null as unknown as CompetitionInfo]).expect(400);
      await patchCircuits(competitions[0].id, [{ course: '60 km', gpxTraceId: '' }]).expect(200);
      expect(await storedCircuits(competitions[0].id)).toEqual([{ course: '60 km' }]);
    });

    it('rejects a GPX trace of another competition', async () => {
      const { id: gpxTraceId } = (
        await upload(competitions[2].id, lineGpx(1), getAuthHelper().getAdminToken()).expect(201)
      ).body as UploadedGpxTrace;
      await patchCircuits(competitions[0].id, [{ course: '60 km', gpxTraceId }]).expect(400);
    });

    it('rejects a GPX trace on a competition being created', async () => {
      const { id: gpxTraceId } = (await upload(competitions[0].id, lineGpx(1)).expect(201))
        .body as UploadedGpxTrace;
      await request(server())
        .post('/api/v2/competitions')
        .set('Authorization', `Bearer ${orga()}`)
        .send({
          name: 'Nouvelle épreuve',
          clubId: clubs[0].id,
          competitionInfo: [{ course: '60 km', gpxTraceId }],
        })
        .expect(400);
    });

    it('turns a link into a GPX trace, and drops empty links', async () => {
      await patchCircuits(competitions[0].id, [
        { course: '60 km', info3: 'https://www.openrunner.com/r/1' },
      ]).expect(200);
      const { id: gpxTraceId } = (await upload(competitions[0].id, lineGpx(1)).expect(201))
        .body as UploadedGpxTrace;

      await patchCircuits(competitions[0].id, [
        { course: '60 km', gpxTraceId },
        { course: '90 km', info3: '  ' },
        { course: '120 km', info3: ' https://example.com/parcours ' },
      ]).expect(200);

      expect(await storedCircuits(competitions[0].id)).toEqual([
        { course: '60 km', gpxTraceId },
        { course: '90 km' },
        { course: '120 km', info3: 'https://example.com/parcours' },
      ]);
    });
  });

  describe('orphan purge', () => {
    it('deletes old unreferenced traces only', async () => {
      const referenced = (await upload(competitions[0].id, lineGpx(1)).expect(201))
        .body as UploadedGpxTrace;
      const orphan = (await upload(competitions[0].id, lineGpx(2)).expect(201))
        .body as UploadedGpxTrace;
      const recentOrphan = (await upload(competitions[0].id, lineGpx(3)).expect(201))
        .body as UploadedGpxTrace;
      await setCircuitGpxTrace(competitions[0], referenced.id);

      const dataSource = getApp().get(DataSource);
      await dataSource.query(
        `UPDATE "competition_gpx_trace" SET "created_at" = now() - interval '25 hours' WHERE "id" IN ($1, $2)`,
        [referenced.id, orphan.id],
      );

      await expect(getApp().get(GpxTracesService).purgeOrphans()).resolves.toBe(1);
      const remaining: { id: string }[] = await dataSource.query(
        `SELECT "id" FROM "competition_gpx_trace"`,
      );
      expect(remaining.map(r => r.id).sort()).toEqual([referenced.id, recentOrphan.id].sort());
    });
  });

  describe('competition duplication', () => {
    it('copies the circuit traces under new ids, once for circuits sharing a GPX', async () => {
      const gpxTrace = (await upload(competitions[0].id, lineGpx(1)).expect(201))
        .body as UploadedGpxTrace;
      const gpxTraceId = gpxTrace.id;
      await setCircuitGpxTrace(competitions[0], gpxTraceId);
      competitions[0].competitionInfo.push({ course: '20 km bis', gpxTraceId });
      await getApp().get(DataSource).getRepository(CompetitionEntity).save(competitions[0]);

      const res = await request(server())
        .post(`/api/v2/competitions/${competitions[0].id}/duplicate`)
        .set('Authorization', `Bearer ${orga()}`)
        .expect(201);
      const copy = res.body as CompetitionEntity;
      const copyGpxTraceId = copy.competitionInfo[0].gpxTraceId!;

      expect(copyGpxTraceId).not.toBe(gpxTraceId);
      expect(copy.competitionInfo[1].gpxTraceId).toBe(copyGpxTraceId);
      await request(server())
        .get(`${base(copy.id)}/${copyGpxTraceId}`)
        .set('Authorization', `Bearer ${mobile()}`)
        .expect(200);
      // L'original garde son tracé.
      await request(server())
        .get(`${base(competitions[0].id)}/${gpxTraceId}`)
        .set('Authorization', `Bearer ${mobile()}`)
        .expect(200);
    });
  });
});
