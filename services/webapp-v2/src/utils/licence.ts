import { getCateaOptions } from '@/config/federations';

const AGE_CATEGORIES = [
  { min: 5, max: 6, code: 'MO' },
  { min: 7, max: 8, code: 'PO' },
  { min: 9, max: 10, code: 'PU' },
  { min: 11, max: 12, code: 'B' },
  { min: 13, max: 14, code: 'M' },
  { min: 15, max: 16, code: 'C' },
  { min: 17, max: 18, code: 'J' },
  { min: 19, max: 22, code: 'E' },
  { min: 23, max: 39, code: 'S' },
  { min: 40, max: 49, code: 'V' },
  { min: 50, max: 59, code: 'SV' },
  { min: 60, max: 69, code: 'A' },
  { min: 70, max: Infinity, code: 'SA' },
] as const;

export const computeAgeCategory = (gender: string, birthYear: number, season: string, fede?: string): string => {
  const seasonYear = season ? parseInt(season) : new Date().getFullYear();
  const age = seasonYear - birthYear;

  const prefix = gender === 'F' ? 'F' : '';
  const ageCategory = AGE_CATEGORIES.find(({ min, max }) => age >= min && age <= max);
  const computed = prefix + (ageCategory?.code ?? '');

  // Si la fédération est renseignée, vérifier que la catégorie existe
  if (fede && computed) {
    const validOptions = getCateaOptions(fede, gender);
    const isValid = validOptions.some(opt => opt.value === computed);
    if (!isValid && validOptions.length > 0) {
      // Retourner la dernière catégorie disponible (ex: "A" pour UFOLEP au lieu de "SA")
      return validOptions[0].value;
    }
  }

  return computed;
};
