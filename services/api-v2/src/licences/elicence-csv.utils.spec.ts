import { computeCateaFromBirthYear } from './elicence-csv.utils';

/** Année de naissance donnant `age` ans sur la saison courante (même base que la fonction). */
const birthYearForAge = (age: number): string => String(new Date().getFullYear() - age);

describe('computeCateaFromBirthYear', () => {
  it.each([
    [3, 'H', 'PUC'],
    [4, 'H', 'PUC'],
    [3, 'F', 'FPUC'],
    [4, 'F', 'FPUC'],
  ])('%i ans (%s) → Puceron %s', (age, gender, expected) => {
    expect(computeCateaFromBirthYear(birthYearForAge(age), gender)).toBe(expected);
  });

  it('les bornes voisines restent inchangées : 5 ans = Moustic, 2 ans = aucune catégorie', () => {
    expect(computeCateaFromBirthYear(birthYearForAge(5), 'H')).toBe('MO');
    expect(computeCateaFromBirthYear(birthYearForAge(5), 'F')).toBe('FMO');
    expect(computeCateaFromBirthYear(birthYearForAge(2), 'H')).toBe('');
  });

  it.each([
    [7, 'PO'],
    [9, 'PU'],
    [11, 'B'],
    [13, 'M'],
    [15, 'C'],
    [17, 'J'],
    [19, 'E'],
    [23, 'S'],
    [40, 'V'],
    [50, 'SV'],
    [60, 'A'],
    [70, 'SA'],
  ])('%i ans (H) → %s (non-régression)', (age, expected) => {
    expect(computeCateaFromBirthYear(birthYearForAge(age), 'H')).toBe(expected);
  });
});
