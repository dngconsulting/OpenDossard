import { RaceRowDto } from '../../../races/dto/race-row.dto';
import {
  rankOfCate,
  transformRows,
  getChallengeWinners,
  displayDossard,
} from './classements.utils';

function row(partial: Partial<RaceRowDto>): RaceRowDto {
  return {
    id: 0,
    raceCode: '1/2',
    catev: '2',
    riderNumber: 1,
    licenceId: 0,
    competitionId: 1,
    name: 'X',
    ...partial,
  } as RaceRowDto;
}

describe('classements.utils', () => {
  const rows: RaceRowDto[] = [
    row({ id: 1, rankingScratch: 1, catev: '1', gender: 'H', name: 'A', riderNumber: 5 }),
    row({ id: 2, rankingScratch: 2, catev: '2', gender: 'H', name: 'B' }),
    row({ id: 3, rankingScratch: 3, catev: '2', gender: 'F', name: 'C' }),
    row({
      id: 4,
      rankingScratch: 4,
      catev: '2',
      gender: 'H',
      name: 'D',
      sprintchallenge: true,
      club: 'VCT',
    }),
    row({ id: 5, comment: 'ABD', catev: '2', gender: 'H', name: 'E' }),
    row({ id: 6, catev: '2', gender: 'H', name: 'F' }), // engagé non classé
    row({ id: 7, raceCode: '3', rankingScratch: 1, catev: '3', name: 'G' }), // autre course
  ];

  describe('rankOfCate', () => {
    it('classe les hommes dans leur catégorie (même sémantique que le web : le pool catev inclut les femmes)', () => {
      expect(rankOfCate(rows[1], rows)).toBe(1); // B : 1er de la catev « 2 »
      expect(rankOfCate(rows[3], rows)).toBe(3); // D : 3e de la catev « 2 » (B, C, D — C est comptée)
    });
    it('classe les femmes entre elles, toutes catégories', () => {
      expect(rankOfCate(rows[2], rows)).toBe(1);
    });
    it('retourne null sans rang scratch ou avec commentaire', () => {
      expect(rankOfCate(rows[4], rows)).toBeNull();
      expect(rankOfCate(rows[5], rows)).toBeNull();
    });
  });

  describe('transformRows', () => {
    it('ordonne classés, puis lignes vides, puis abandons, pour une course', () => {
      const out = transformRows(rows, '1/2');
      expect(out).toHaveLength(6);
      expect(out.map(r => r.name)).toEqual(['A', 'B', 'C', 'D', null, 'E']);
      expect(out.map(r => r.position)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(out[0].rankOfCate).toBe(1);
      expect(out[5].comment).toBe('ABD');
    });
    it('retourne [] pour une course sans engagé', () => {
      expect(transformRows(rows, '4')).toEqual([]);
    });

    it('course entièrement abandonnée : aucune ligne vide, positions 1..n, rangs null', () => {
      const dnf = [
        row({ id: 10, raceCode: '5', comment: 'ABD', name: 'A' }),
        row({ id: 11, raceCode: '5', comment: 'NC', name: 'B' }),
        row({ id: 12, raceCode: '5', comment: 'CHT', name: 'C' }),
      ];
      const out = transformRows(dnf, '5');
      expect(out).toHaveLength(3);
      expect(out.map(r => r.position)).toEqual([1, 2, 3]);
      expect(out.map(r => r.comment)).toEqual(['ABD', 'NC', 'CHT']);
      expect(out.every(r => r.id !== null)).toBe(true);
      expect(out.every(r => r.rankOfCate === null)).toBe(true);
    });

    it('course 100 % féminine : rangs 1, 2, 3 par scratch toutes catégories confondues', () => {
      const women = [
        row({ id: 20, raceCode: 'F', gender: 'F', catev: '3', rankingScratch: 3, name: 'C' }),
        row({ id: 21, raceCode: 'F', gender: 'F', catev: '1', rankingScratch: 1, name: 'A' }),
        row({ id: 22, raceCode: 'F', gender: 'F', catev: '2', rankingScratch: 2, name: 'B' }),
      ];
      const out = transformRows(women, 'F');
      expect(out.map(r => r.name)).toEqual(['A', 'B', 'C']);
      expect(out.map(r => r.rankOfCate)).toEqual([1, 2, 3]);
    });

    it('égalité de scratch : le tri stable conserve l’ordre d’entrée', () => {
      const tied = [
        row({ id: 30, raceCode: 'T', rankingScratch: 1, name: 'PREMIER' }),
        row({ id: 31, raceCode: 'T', rankingScratch: 1, name: 'SECOND' }),
        row({ id: 32, raceCode: 'T', rankingScratch: 2, name: 'TROISIÈME' }),
      ];
      const out = transformRows(tied, 'T');
      expect(out.map(r => r.id)).toEqual([30, 31, 32]);
      expect(out.map(r => r.rankOfCate)).toEqual([1, 2, 3]);
    });

    it('nom : repli sur riderName, et forme complète de la ligne vide', () => {
      const withFallback = [
        row({ id: 40, raceCode: 'R', rankingScratch: 1, name: undefined, riderName: 'DUPONT' }),
        row({ id: 41, raceCode: 'R', name: 'ENGAGÉ' }), // engagé non classé → ligne vide
      ];
      const out = transformRows(withFallback, 'R');
      expect(out[0].name).toBe('DUPONT');
      expect(out[1]).toEqual({
        position: 2,
        id: null,
        riderNumber: null,
        rankingScratch: null,
        comment: null,
        name: null,
        club: null,
        gender: null,
        catev: null,
        catea: null,
        fede: null,
        chrono: null,
        tours: null,
        sprintchallenge: false,
        rankOfCate: null,
      });
    });
  });

  it('displayDossard pad à 3 chiffres', () => {
    expect(displayDossard(5)).toBe('005');
    expect(displayDossard('123')).toBe('123');
  });

  describe('getChallengeWinners', () => {
    it('liste nom (club) ou NC', () => {
      const out = transformRows(rows, '1/2');
      expect(getChallengeWinners(out)).toBe('D (VCT)');
      expect(getChallengeWinners(transformRows(rows, '3'))).toBe('NC');
    });

    it('joint plusieurs vainqueurs, club manquant affiché « NC »', () => {
      const multi = [
        ...rows,
        row({ id: 8, rankingScratch: 5, name: 'X', sprintchallenge: true }), // sans club
      ];
      expect(getChallengeWinners(transformRows(multi, '1/2'))).toBe('D (VCT), X (NC)');
    });
  });
});
