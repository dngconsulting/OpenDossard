import { DataSource } from 'typeorm';

import { getApp, getSeedHelper } from '../setup-e2e';
import { ChallengeEntity } from '../../src/challenges/entities/challenge.entity';
import { CompetitionType, Federation } from '../../src/common/enums';
import { CompetitionEntity } from '../../src/competitions/entities/competition.entity';
import { LicenceEntity } from '../../src/licences/entities/licence.entity';
import { RaceEntity } from '../../src/races/entities/race.entity';

/**
 * Deux épreuves FSGT route, trois hommes en catégorie 2, barème assiduité (1 pt par course) :
 *  - ALPHA : 1er puis 2e → 2 pts
 *  - BRAVO : 2e puis 1er → 2 pts, devant ALPHA grâce à la dernière épreuve
 *  - CHARLIE : 3e à la première seulement → 1 pt
 */
export async function seedRankedChallenge() {
  const ds = getApp().get(DataSource);
  const comps = await ds.getRepository(CompetitionEntity).save(
    [new Date('2025-05-01T09:00:00Z'), new Date('2025-06-01T09:00:00Z')].map((eventDate, i) =>
      ds.getRepository(CompetitionEntity).create({
        name: `Épreuve ${i + 1}`,
        eventDate,
        zipCode: '31000',
        categories: '1,2,3',
        races: '1/2/3',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
      }),
    ),
  );
  const licences = await ds.getRepository(LicenceEntity).save(
    ['ALPHA', 'BRAVO', 'CHARLIE'].map((name, i) =>
      ds.getRepository(LicenceEntity).create({
        name,
        firstName: name,
        licenceNumber: `9000000${i}`,
        gender: 'H',
        club: 'VC Test',
        dept: '31',
        birthYear: '1985',
        catea: 'S',
        catev: '2',
        fede: Federation.FSGT,
        saison: '2025',
      }),
    ),
  );
  const [alpha, bravo, charlie] = licences;
  const results: [CompetitionEntity, LicenceEntity, number][] = [
    [comps[0], alpha, 1],
    [comps[0], bravo, 2],
    [comps[0], charlie, 3],
    [comps[1], bravo, 1],
    [comps[1], alpha, 2],
  ];
  await ds.getRepository(RaceEntity).save(
    results.map(([comp, lic, rankingScratch], i) =>
      ds.getRepository(RaceEntity).create({
        competitionId: comp.id,
        licenceId: lic.id,
        raceCode: '1/2/3',
        catev: '2',
        catea: 'S',
        riderNumber: 100 + i,
        club: lic.club,
        rankingScratch,
      }),
    ),
  );
  const challenge = await ds.getRepository(ChallengeEntity).save(
    ds.getRepository(ChallengeEntity).create({
      name: 'Challenge cycle de vie',
      active: true,
      competitionIds: comps.map(c => c.id),
      bareme: 'BAREME_ASSIDUITE',
      competitionType: 'ROUTE',
    }),
  );
  return { challenge, alpha, bravo, charlie, ds };
}

/** Épreuves FSGT route, une par jour à partir du 1er mars 2025 (la dernière est la plus récente). */
async function saveCompetitions(ds: DataSource, count: number): Promise<CompetitionEntity[]> {
  const repo = ds.getRepository(CompetitionEntity);
  return repo.save(
    Array.from({ length: count }, (_, i) =>
      repo.create({
        name: `Épreuve ${i + 1}`,
        eventDate: new Date(Date.UTC(2025, 2, 1 + i, 9)),
        zipCode: '31000',
        categories: '1,2,3',
        races: '1/2/3',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
      }),
    ),
    { chunk: 200 },
  );
}

/** Hommes FSGT en catégorie 2, nommés `${prefix}01`, `${prefix}02`… */
async function saveLicences(ds: DataSource, prefix: string, count: number) {
  const repo = ds.getRepository(LicenceEntity);
  return repo.save(
    Array.from({ length: count }, (_, i) => {
      const name = `${prefix}${String(i + 1).padStart(2, '0')}`;
      return repo.create({
        name,
        firstName: name,
        licenceNumber: `${prefix}-${i + 1}`,
        gender: 'H',
        club: 'VC Test',
        dept: '31',
        birthYear: '1985',
        catea: 'S',
        catev: '2',
        fede: Federation.FSGT,
        saison: '2025',
      });
    }),
  );
}

type RaceSeed = { comp: CompetitionEntity; lic: LicenceEntity; place: number | null };

/** Insère les résultats par lots (sous la limite de paramètres de Postgres). */
async function insertRaces(ds: DataSource, races: RaceSeed[]): Promise<void> {
  const repo = ds.getRepository(RaceEntity);
  const entities = races.map(({ comp, lic, place }, i) =>
    repo.create({
      competitionId: comp.id,
      licenceId: lic.id,
      raceCode: '1/2/3',
      catev: '2',
      catea: 'S',
      riderNumber: 1000 + i,
      club: lic.club,
      rankingScratch: place,
      comment: place === null ? 'DNF' : null,
    }),
  );
  for (let i = 0; i < entities.length; i += 1000) {
    await repo.insert(entities.slice(i, i + 1000));
  }
}

async function saveChallenge(ds: DataSource, comps: CompetitionEntity[]) {
  const repo = ds.getRepository(ChallengeEntity);
  return repo.save(
    repo.create({
      name: 'Challenge cycle de vie',
      active: true,
      competitionIds: comps.map(c => c.id),
      bareme: 'BAREME_ASSIDUITE',
      competitionType: 'ROUTE',
    }),
  );
}

/**
 * Coupure au 20e rang (barème assiduité, 2 épreuves, hommes catégorie 2) :
 *  - TOP01…TOP19 courent les deux, classés 1…19 à la dernière → 2 pts, rangs 1 à 19
 *  - DNF01, DNF02 courent les deux, DNF à la dernière → 2 pts, non départagés → rang 20 (gardés)
 *  - OUT01, OUT02 ne courent que la première → 1 pt, rang 22 (non archivés)
 */
export async function seedTopCutChallenge() {
  const ds = getApp().get(DataSource);
  const [comp1, comp2] = await saveCompetitions(ds, 2);
  const top = await saveLicences(ds, 'TOP', 19);
  const dnf = await saveLicences(ds, 'DNF', 2);
  const out = await saveLicences(ds, 'OUT', 2);
  const races: RaceSeed[] = [...top, ...dnf, ...out].map((lic, i) => ({
    comp: comp1,
    lic,
    place: i + 1,
  }));
  races.push(...top.map((lic, i) => ({ comp: comp2, lic, place: i + 1 })));
  races.push(...dnf.map(lic => ({ comp: comp2, lic, place: null })));
  await insertRaces(ds, races);
  const challenge = await saveChallenge(ds, [comp1, comp2]);
  return { challenge, ds };
}

/**
 * Gros challenge : `riders` coureurs courant chacun `comps` épreuves, tous archivés
 * (riders ≤ 20). Produit riders × comps lignes de courses dans l'archive.
 */
export async function seedLargeChallenge(riders: number, comps: number) {
  const ds = getApp().get(DataSource);
  const competitions = await saveCompetitions(ds, comps);
  const licences = await saveLicences(ds, 'BIG', riders);
  await insertRaces(
    ds,
    competitions.flatMap(comp => licences.map((lic, i) => ({ comp, lic, place: i + 1 }))),
  );
  const challenge = await saveChallenge(ds, competitions);
  return { challenge, ds };
}

/** Nettoie ce que crée seedRankedChallenge (l'archive part avec le challenge, par cascade). */
export async function cleanRankedChallenge(): Promise<void> {
  await getSeedHelper().cleanChallenges();
  await getSeedHelper().cleanRaces();
  await getSeedHelper().cleanLicences();
  await getSeedHelper().cleanCompetitions();
}
