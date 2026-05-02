import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { ImportEngagesResultDto } from '../src/races/dto/import-engages-result.dto';
import { RaceRowDto } from '../src/races/dto/race-row.dto';

const API = '/api/v2/races';

describe('Import engagés CSV (e2e)', () => {
  let adminToken: string;
  let competitions: CompetitionEntity[];

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
  });

  beforeEach(async () => {
    const dataset = await getSeedHelper().seedFullDataset();
    competitions = dataset.competitions;
  });

  afterEach(async () => {
    await getSeedHelper().cleanRaces();
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanLicences();
    await getSeedHelper().cleanClubs();
  });

  const buildCsv = (lines: string[]): Buffer => {
    const header = 'Dossard;Nom;Club;Sexe;Dept;Année;CatéA;CatéV;Licence;Fédé;Course';
    return Buffer.from([header, ...lines].join('\n'), 'utf-8');
  };

  it("classe chaque ligne dans le bon bucket et n'insère que les lignes valides", async () => {
    // Use competitions[2] (Gravel des Pyrénées) which has no pre-existing races
    const competitionId = competitions[2].id;

    // licences[0] = DUPONT Jean, 12345678, club="Vélo Club Toulousain", dept=31, year=1985, S, 2, FSGT
    // licences[1] = MARTIN Marie, 87654321, club="Cyclo Club Gascon", dept=32, year=1990, FS, 3, FSGT
    // licences[2] = GARCÍA Pierre, 11223344, club="Racing Club Bordelais", dept=33, year=1978, V, 1, FFC
    const csv = buildCsv([
      // L2 — OK (insert) — CatéV CSV "9" ≠ licence "2" : volontairement ignoré (catégorie de course)
      '101;DUPONT Jean;Vélo Club Toulousain;H;31;1985;S;9;12345678;FSGT;1',
      // L3 — DIVERGENT (club CSV "Wrong Club" ≠ DB "Cyclo Club Gascon")
      '201;MARTIN Marie;Wrong Club;F;32;1990;FS;3;87654321;FSGT;2',
      // L4 — OK (insert)
      '301;GARCÍA Pierre;Racing Club Bordelais;H;33;1978;V;1;11223344;FFC;1',
      // L5 — UNKNOWN (licence 99999999 absente)
      '102;FAKE Person;Some Club;H;31;1990;S;2;99999999;FSGT;1',
      // L6 — DUPLICATE (DUPONT déjà inséré L2 — autre course)
      '105;DUPONT Jean;Vélo Club Toulousain;H;31;1985;S;2;12345678;FSGT;2',
      // L7 — MISSING (licence vide)
      '999;NoLicence;Club;H;31;1990;S;2;;FSGT;1',
      // L8 — DOSSARD COLLISION (101 sur course 1 utilisé par DUPONT licence 12345678)
      '101;MARTIN Marie;Cyclo Club Gascon;F;32;1990;FS;3;87654321;FSGT;1',
    ]);

    const res = await request(getApp().getHttpServer())
      .post(`${API}/import/${competitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', csv, 'engages.csv')
      .expect(201);

    const body = res.body as ImportEngagesResultDto;

    expect(body.summary.total).toBe(7);
    expect(body.summary.inserted).toBe(2);
    expect(body.summary.duplicates).toBe(1);
    expect(body.summary.unknownLicences).toBe(1);
    expect(body.summary.anomalies).toBe(3);

    // Vérifier la persistance : 2 races insérées sur cette compétition (via l'API)
    const racesRes = await request(getApp().getHttpServer())
      .get(`${API}/competition/${competitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const racesAfter = racesRes.body as RaceRowDto[];
    expect(racesAfter).toHaveLength(2);

    // Vérifier les buckets en détail
    expect(body.details.inserted.map(i => i.licenceNumber).sort()).toEqual([
      '11223344',
      '12345678',
    ]);

    expect(body.details.unknownLicences).toHaveLength(1);
    expect(body.details.unknownLicences[0].licenceNumber).toBe('99999999');
    expect(body.details.unknownLicences[0].line).toBe(5);

    expect(body.details.duplicates).toHaveLength(1);
    expect(body.details.duplicates[0].licenceNumber).toBe('12345678');
    expect(body.details.duplicates[0].line).toBe(6);

    const divergent = body.details.anomalies.find(a => a.kind === 'divergent');
    expect(divergent).toBeDefined();
    expect(divergent!.line).toBe(3);
    expect(divergent!.diffs?.some(d => d.field === 'Club')).toBe(true);

    // CatéV n'est JAMAIS comparée — aucune anomalie ne doit reporter ce field
    body.details.anomalies.forEach(a => {
      expect(a.diffs?.some(d => d.field === 'CatéV')).not.toBe(true);
    });

    const missing = body.details.anomalies.find(a => a.kind === 'missing');
    expect(missing).toBeDefined();
    expect(missing!.line).toBe(7);
    expect(missing!.missingFields).toContain('Licence');

    const collision = body.details.anomalies.find(a => a.kind === 'dossardCollision');
    expect(collision).toBeDefined();
    expect(collision!.line).toBe(8);
    expect(collision!.message).toMatch(/Dossard 101/);
  });

  it('ignore CatéV dans le match strict ET stocke la valeur du CSV dans race.catev', async () => {
    const competitionId = competitions[2].id;
    // Licence DUPONT a catev=2 en DB. CSV envoie catev=9 (volontairement aberrant)
    // → ne doit PAS produire d'anomalie, la ligne doit être insérée AVEC race.catev="9".
    const csv = buildCsv(['101;DUPONT Jean;Vélo Club Toulousain;H;31;1985;S;9;12345678;FSGT;1']);

    const res = await request(getApp().getHttpServer())
      .post(`${API}/import/${competitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', csv, 'engages.csv')
      .expect(201);

    const body = res.body as ImportEngagesResultDto;
    expect(body.summary.inserted).toBe(1);
    expect(body.summary.anomalies).toBe(0);

    // Vérifier que race.catev contient bien "9" (CSV) et pas "2" (licence)
    const racesRes = await request(getApp().getHttpServer())
      .get(`${API}/competition/${competitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const racesAfter = racesRes.body as RaceRowDto[];
    expect(racesAfter).toHaveLength(1);
    expect(racesAfter[0].catev).toBe('9');
  });

  it('round-trip : un CSV propre cohérent avec la DB ré-importé sur compétition vide insère tout', async () => {
    const competitionId = competitions[2].id;
    const csv = buildCsv([
      '1;DUPONT Jean;Vélo Club Toulousain;H;31;1985;S;2;12345678;FSGT;1',
      '2;MARTIN Marie;Cyclo Club Gascon;F;32;1990;FS;3;87654321;FSGT;2',
      '3;GARCÍA Pierre;Racing Club Bordelais;H;33;1978;V;1;11223344;FFC;1',
    ]);

    const res = await request(getApp().getHttpServer())
      .post(`${API}/import/${competitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', csv, 'engages.csv')
      .expect(201);

    const body = res.body as ImportEngagesResultDto;
    expect(body.summary.inserted).toBe(3);
    expect(body.summary.duplicates).toBe(0);
    expect(body.summary.unknownLicences).toBe(0);
    expect(body.summary.anomalies).toBe(0);
  });

  it('détecte les doublons pré-existants dans la compétition (licence déjà engagée toutes courses confondues)', async () => {
    // competitions[0] a déjà DUPONT engagé en 1/2 et MARTIN en 3
    const competitionId = competitions[0].id;
    const csv = buildCsv([
      // DUPONT — déjà engagé sur 1/2 → doublon même si on tente sur 3
      '999;DUPONT Jean;Vélo Club Toulousain;H;31;1985;S;2;12345678;FSGT;3',
      // GARCÍA — pas encore engagé → OK
      '500;GARCÍA Pierre;Racing Club Bordelais;H;33;1978;V;1;11223344;FFC;1/2',
    ]);

    const res = await request(getApp().getHttpServer())
      .post(`${API}/import/${competitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', csv, 'engages.csv')
      .expect(201);

    const body = res.body as ImportEngagesResultDto;
    expect(body.summary.inserted).toBe(1);
    expect(body.summary.duplicates).toBe(1);
    expect(body.details.duplicates[0].licenceNumber).toBe('12345678');
    expect(body.details.duplicates[0].existingRaceCode).toBe('1/2');
  });

  it("retourne 404 si la compétition n'existe pas", async () => {
    const csv = buildCsv(['1;DUPONT Jean;X;H;31;1985;S;2;12345678;FSGT;1']);
    await request(getApp().getHttpServer())
      .post(`${API}/import/9999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', csv, 'engages.csv')
      .expect(404);
  });

  it('refuse un appel non authentifié', async () => {
    const csv = buildCsv(['1;DUPONT Jean;X;H;31;1985;S;2;12345678;FSGT;1']);
    await request(getApp().getHttpServer())
      .post(`${API}/import/${competitions[0].id}`)
      .attach('file', csv, 'engages.csv')
      .expect(401);
  });
});
