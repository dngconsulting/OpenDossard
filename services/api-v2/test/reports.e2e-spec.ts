import { Stream } from 'stream';
import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';

const API = '/api/v2/reports/pdf/classements';

/** superagent ne bufferise pas `application/pdf` par défaut : on accumule les chunks nous-mêmes. */
function binaryParser(res: Stream, cb: (err: Error | null, body: Buffer) => void): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
}

describe('Reports PDF classements (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;
  let competitions: CompetitionEntity[];

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  beforeEach(async () => {
    competitions = (await getSeedHelper().seedFullDataset()).competitions;
  });

  afterEach(async () => {
    await getSeedHelper().cleanRaces();
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanLicences();
    await getSeedHelper().cleanClubs();
  });

  it.each([
    ['ADMIN', () => adminToken],
    ['ORGANISATEUR', () => orgaToken],
    ['MOBILE', () => mobileToken],
  ])('should return a PDF for role %s', async (_role, token) => {
    const competitionId = competitions[0].id;
    const res = await request(getApp().getHttpServer())
      .get(`${API}/${competitionId}`)
      .set('Authorization', `Bearer ${token()}`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    const body = res.body as Buffer;
    expect(body.subarray(0, 4).toString()).toBe('%PDF');
    expect(res.headers['content-disposition']).toContain(`classements_${competitionId}.pdf`);
    expect(Number(res.headers['content-length'])).toBe(body.length);
  });

  it('should return 404 for unknown competition', async () => {
    await request(getApp().getHttpServer())
      .get(`${API}/999999`)
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(404);
  });

  it('should return 400 for non-numeric id', async () => {
    await request(getApp().getHttpServer())
      .get(`${API}/abc`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  it('should return 401 without token', async () => {
    await request(getApp().getHttpServer()).get(`${API}/${competitions[0].id}`).expect(401);
  });
});
