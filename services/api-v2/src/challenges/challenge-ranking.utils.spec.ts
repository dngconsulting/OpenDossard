import { ChallengeRaceRowDto, ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { ARCHIVE_TOP_N, keepTop, rankRiders, withoutRank } from './challenge-ranking.utils';

const D1 = new Date('2025-05-01T09:00:00Z');
const D2 = new Date('2025-06-01T09:00:00Z');

function row(
  eventDate: Date,
  rankingScratch: number | null,
  comment: string | null = null,
  overrides: Partial<ChallengeRaceRowDto> = {},
): ChallengeRaceRowDto {
  return {
    licenceId: '0',
    competitionId: eventDate === D1 ? 1 : 2,
    competitionName: 'X',
    eventDate,
    catev: '2',
    rankingScratch: rankingScratch as number,
    nbParticipants: 10,
    comment: comment as string,
    sprintchallenge: false,
    ptsRace: 0,
    ...overrides,
  };
}

function rider(
  name: string,
  pts: number,
  rows: ChallengeRaceRowDto[],
  overrides: Partial<ChallengeRiderDto> = {},
): ChallengeRiderDto {
  return {
    licenceId: name,
    name,
    firstName: name,
    gender: 'H',
    currentLicenceCatev: '2',
    currentLicenceCatea: 'S',
    currentClub: 'C',
    challengeRaceRows: rows,
    ptsAllRaces: pts,
    ...overrides,
  };
}

describe('rankRiders', () => {
  it('classe par points décroissants', () => {
    const out = rankRiders([rider('A', 10, [row(D2, 3)]), rider('B', 30, [row(D2, 1)])]);
    expect(out.map(r => [r.name, r.rank])).toEqual([
      ['B', 1],
      ['A', 2],
    ]);
  });

  it('départage par le scratch de la dernière épreuve quand les deux y sont classés', () => {
    const out = rankRiders([
      rider('A', 20, [row(D1, 1), row(D2, 2)]),
      rider('B', 20, [row(D1, 2), row(D2, 1)]),
    ]);
    expect(out.map(r => [r.name, r.rank])).toEqual([
      ['B', 1],
      ['A', 2],
    ]);
  });

  it('un coureur classé à la dernière épreuve passe devant un absent', () => {
    const out = rankRiders([rider('A', 20, [row(D1, 1)]), rider('B', 20, [row(D2, 5)])]);
    expect(out.map(r => [r.name, r.rank])).toEqual([
      ['B', 1],
      ['A', 2],
    ]);
  });

  it('un DNF à la dernière épreuve compte comme non classé', () => {
    const out = rankRiders([rider('A', 20, [row(D2, null, 'DNF')]), rider('B', 20, [row(D2, 9)])]);
    expect(out.map(r => [r.name, r.rank])).toEqual([
      ['B', 1],
      ['A', 2],
    ]);
  });

  it('ex æquo si aucun des deux n’est classé à la dernière épreuve (pas de remontée)', () => {
    const out = rankRiders([
      rider('A', 20, [row(D1, 1)]),
      rider('B', 20, [row(D1, 2)]),
      rider('C', 10, [row(D2, 1)]),
    ]);
    expect(out.map(r => r.rank)).toEqual([1, 1, 3]);
  });

  it('calcule le rang séparément par sexe et par catégorie', () => {
    const out = rankRiders([
      rider('H2', 10, [row(D2, 1)]),
      rider('F2', 5, [row(D2, 1)], { gender: 'F' }),
      rider('H3', 1, [row(D2, 1)], { currentLicenceCatev: '3' }),
    ]);
    const ranks = Object.fromEntries(out.map(r => [r.name, r.rank]));
    expect(ranks).toEqual({ H2: 1, F2: 1, H3: 1 });
  });

  it('ordonne la sortie par catégorie, puis points, puis rang', () => {
    const out = rankRiders([
      rider('H3', 50, [row(D2, 1)], { currentLicenceCatev: '3' }),
      rider('A', 20, [row(D2, 2)]),
      rider('B', 20, [row(D2, 1)]),
    ]);
    expect(out.map(r => r.name)).toEqual(['B', 'A', 'H3']);
  });

  it('ignore une place obtenue dans la course d’une autre catégorie', () => {
    // A a couru la dernière épreuve en catégorie 4 : sa place n'est pas comparable à celle de B.
    const out = rankRiders([
      rider('A', 20, [row(D2, 1, null, { catev: '4' })]),
      rider('B', 20, [row(D2, 5)]),
    ]);
    expect(out.map(r => [r.name, r.rank])).toEqual([
      ['B', 1],
      ['A', 2],
    ]);
  });

  it('deux épreuves le même jour : la dernière est celle au plus grand identifiant', () => {
    const out = rankRiders([
      rider('A', 20, [row(D2, 2, null, { competitionId: 2 })]),
      rider('B', 20, [row(D2, 1, null, { competitionId: 3 })]),
      rider('C', 20, [row(D2, 3, null, { competitionId: 3 })]),
    ]);
    expect(out.map(r => [r.name, r.rank])).toEqual([
      ['B', 1],
      ['C', 2],
      ['A', 3],
    ]);
  });

  it('keepTop garde les rangs ≤ n par groupe, ex æquo inclus', () => {
    const ranked = rankRiders([
      rider('A', 30, [row(D2, 1)]),
      rider('B', 20, [row(D1, 1)]),
      rider('C', 20, [row(D1, 2)]),
      rider('D', 10, [row(D2, 3)]),
      rider('F1', 5, [row(D2, 1)], { gender: 'F' }),
    ]);
    // A=1, B=C=2 (ex æquo), D=4 ; F1=1 dans son groupe
    expect(
      keepTop(ranked, 2)
        .map(r => r.name)
        .sort(),
    ).toEqual(['A', 'B', 'C', 'F1']);
  });

  it('ARCHIVE_TOP_N vaut 20', () => {
    expect(ARCHIVE_TOP_N).toBe(20);
  });

  it('withoutRank retire le champ rank', () => {
    const [ranked] = rankRiders([rider('A', 1, [row(D2, 1)])]);
    expect(withoutRank([ranked])[0]).not.toHaveProperty('rank');
  });
});
