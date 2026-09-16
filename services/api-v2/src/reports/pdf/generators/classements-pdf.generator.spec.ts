import { CompetitionEntity } from '../../../competitions/entities/competition.entity';
import { RaceRowDto } from '../../../races/dto/race-row.dto';
import { competitionRaces, generateClassementsPDF } from './classements-pdf.generator';

describe('generateClassementsPDF', () => {
  const competition = {
    id: 1,
    name: 'Grand Prix Test',
    eventDate: new Date(2026, 2, 15),
    fede: 'FSGT',
    competitionType: 'CX',
    races: '1/2,3',
    avecChrono: true,
    commissaires: 'M. Untel',
    club: { longName: 'Vélo Club Test' },
  } as unknown as CompetitionEntity;

  const rows = [
    {
      id: 1,
      raceCode: '1/2',
      catev: '2',
      gender: 'H',
      riderNumber: 5,
      rankingScratch: 1,
      name: 'A',
      chrono: '1:02:03',
      tours: 4,
    },
    { id: 2, raceCode: '3', catev: '3', gender: 'H', riderNumber: 6, comment: 'ABD', name: 'B' },
  ] as RaceRowDto[];

  /**
   * Nombre de pages : objets « /Type /Page » (hors « /Type /Pages ») du PDF.
   * Repose sur le fait que jsPDF écrit les dictionnaires de page non compressés
   * (seuls les flux de contenu le sont avec `compress: true`).
   */
  const countPages = (buf: Buffer): number =>
    (buf.toString('latin1').match(/\/Type \/Page(?!s)/g) ?? []).length;

  /** Coureurs hommes classés d'une même course/catégorie, scratch 1..count. */
  const rankedMen = (count: number, raceCode: string): RaceRowDto[] =>
    Array.from(
      { length: count },
      (_, i) =>
        ({
          id: i + 1,
          raceCode,
          catev: '2',
          gender: 'H',
          riderNumber: i + 1,
          rankingScratch: i + 1,
          name: `COUREUR ${i + 1}`,
          club: 'Club',
        }) as RaceRowDto,
    );

  it('retourne un Buffer PDF avec une page par course', () => {
    const buf = generateClassementsPDF(competition, rows);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(countPages(buf)).toBe(2);
  });

  it('gère une épreuve sans course', () => {
    const buf = generateClassementsPDF({ ...competition, races: '' } as CompetitionEntity, []);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(countPages(buf)).toBe(1);
  });

  it('reporte le pied de page sur une nouvelle page quand le tableau descend trop bas', () => {
    // 38 lignes tiennent sur la page 1 mais laissent finalY > 240 : le pied de page passe en page 2
    const oneRace = { ...competition, races: '1/2' } as CompetitionEntity;
    const buf = generateClassementsPDF(oneRace, rankedMen(38, '1/2'));
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(countPages(buf)).toBe(2);
  });

  it('dessine les trois trophées du podium de catégorie', () => {
    const oneRace = { ...competition, races: '1/2' } as CompetitionEntity;
    const single = generateClassementsPDF(oneRace, rankedMen(1, '1/2'));
    const podium = generateClassementsPDF(oneRace, rankedMen(3, '1/2'));
    expect(podium.subarray(0, 4).toString()).toBe('%PDF');
    // Trois PNG embarqués (or, argent, bronze) contre un seul (or) : le PDF grossit
    expect(podium.length).toBeGreaterThan(single.length);
  });
});

describe('competitionRaces', () => {
  it('découpe la chaîne des courses et ignore les entrées vides', () => {
    expect(competitionRaces({ races: ' 1/2, 3 ,' } as CompetitionEntity)).toEqual(['1/2', '3']);
    expect(competitionRaces({ races: '' } as CompetitionEntity)).toEqual([]);
    expect(competitionRaces({} as CompetitionEntity)).toEqual([]);
  });
});
