import { FedeEnum, getCateaOptions } from '@/config/federations';

const AGE_CATEGORIES = [
  { min: 3, max: 4, code: 'PUC' },
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

// Barème FFC : codes neutres, sans préfixe de genre. En dessous de 5 ans → NC.
const AGE_CATEGORIES_FFC = [
  { min: 5, max: 6, code: 'U7' },
  { min: 7, max: 8, code: 'U9' },
  { min: 9, max: 10, code: 'U11' },
  { min: 11, max: 12, code: 'U13' },
  { min: 13, max: 14, code: 'U15' },
  { min: 15, max: 16, code: 'U17' },
  { min: 17, max: 18, code: 'U19' },
  { min: 19, max: 22, code: 'U23' },
  { min: 23, max: 34, code: 'Senior' },
  { min: 35, max: Infinity, code: 'Master' },
] as const;

export const computeAgeCategory = (gender: string, birthYear: number, season: string, fede?: string): string => {
  const seasonYear = season ? parseInt(season) : new Date().getFullYear();
  const age = seasonYear - birthYear;

  if (fede === FedeEnum.FFC) {
    return AGE_CATEGORIES_FFC.find(({ min, max }) => age >= min && age <= max)?.code ?? 'NC';
  }

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

/**
 * Une licence est à jour si sa saison est l'année en cours ou une année future
 * (licence déjà renouvelée pour la saison suivante).
 */
export const isSaisonUpToDate = (saison: string | undefined | null): boolean => {
  const saisonYear = parseInt(saison ?? '', 10);
  return !isNaN(saisonYear) && saisonYear >= new Date().getFullYear();
};
