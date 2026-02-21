/**
 * Configuration des fédérations et leurs catégories
 */

export const FedeEnum = {
  FSGT: 'FSGT',
  UFOLEP: 'UFOLEP',
  FFC: 'FFC',
  CYCLOS: 'CYCLOS',
  FFVELO: 'FFVELO',
  NL: 'NL',
  FFTRI: 'FFTRI',
} as const;

export type FedeEnum = (typeof FedeEnum)[keyof typeof FedeEnum];

export type CompetitionType = 'ROUTE' | 'VTT' | 'CX' | 'GRAVEL' | 'RANDO';

export interface CategoryValue {
  label: string;
  value: string;
  competitionTypes: CompetitionType[];
}

export interface CategoryAge {
  label: string;
  value: string;
  gender: 'H' | 'F';
}

export interface Federation {
  name: { label: string; value: string };
  catev: CategoryValue[];
  catea: CategoryAge[];
}

const ALL_COMPETITION_TYPES: CompetitionType[] = ['ROUTE', 'VTT', 'CX', 'GRAVEL', 'RANDO'];

// Catégories de valeur FSGT/FFC/FFTRI
const CATEV_BASE: CategoryValue[] = [
  { label: 'Catégorie 1', value: '1', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 2', value: '2', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 3', value: '3', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 4', value: '4', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 5', value: '5', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 6', value: '6', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Dames', value: 'DAMES', competitionTypes: ['CX'] },
  { label: 'Junior', value: 'J', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Cadet', value: 'C', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Minime', value: 'M', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Benjamin', value: 'B', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Pupille', value: 'PU', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Poussin', value: 'PO', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Moustic', value: 'MO', competitionTypes: ALL_COMPETITION_TYPES },
];

// Catégories de valeur UFOLEP
const CATEV_UFOLEP: CategoryValue[] = [
  { label: 'Catégorie 1', value: '1', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 2', value: '2', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 3', value: '3', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 4A', value: '4A', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Catégorie 4B', value: '4B', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Féminines', value: 'FEM', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Junior', value: 'J', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Cadet', value: 'C', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Minime', value: 'M', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Benjamin', value: 'B', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Pupille', value: 'PU', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Poussin', value: 'PO', competitionTypes: ALL_COMPETITION_TYPES },
  { label: 'Moustic', value: 'MO', competitionTypes: ALL_COMPETITION_TYPES },
];

// Catégories d'âge FSGT (Hommes et Femmes)
const CATEA_FSGT: CategoryAge[] = [
  // Hommes
  { label: 'Super Ancien', value: 'SA', gender: 'H' },
  { label: 'Ancien', value: 'A', gender: 'H' },
  { label: 'Super Vétéran', value: 'SV', gender: 'H' },
  { label: 'Vétéran', value: 'V', gender: 'H' },
  { label: 'Sénior', value: 'S', gender: 'H' },
  { label: 'Espoir', value: 'E', gender: 'H' },
  { label: 'Junior', value: 'J', gender: 'H' },
  { label: 'Cadet', value: 'C', gender: 'H' },
  { label: 'Minime', value: 'M', gender: 'H' },
  { label: 'Benjamin', value: 'B', gender: 'H' },
  { label: 'Pupille', value: 'PU', gender: 'H' },
  { label: 'Poussin', value: 'PO', gender: 'H' },
  { label: 'Moustic', value: 'MO', gender: 'H' },
  { label: 'NC', value: 'NC', gender: 'H' },
  // Femmes
  { label: 'Féminine super ancien', value: 'FSA', gender: 'F' },
  { label: 'Féminine ancien', value: 'FA', gender: 'F' },
  { label: 'Féminine super vétéran', value: 'FSV', gender: 'F' },
  { label: 'Féminine vétéran', value: 'FV', gender: 'F' },
  { label: 'Féminine sénior', value: 'FS', gender: 'F' },
  { label: 'Féminine espoir', value: 'FE', gender: 'F' },
  { label: 'Féminine junior', value: 'FJ', gender: 'F' },
  { label: 'Féminine cadet', value: 'FC', gender: 'F' },
  { label: 'Féminine minime', value: 'FM', gender: 'F' },
  { label: 'Féminine benjamin', value: 'FB', gender: 'F' },
  { label: 'Féminine pupille', value: 'FPU', gender: 'F' },
  { label: 'Féminine poussin', value: 'FPO', gender: 'F' },
  { label: 'Féminine moustic', value: 'FMO', gender: 'F' },
  { label: 'NC', value: 'NC', gender: 'F' },
];

// Catégories d'âge UFOLEP
const CATEA_UFOLEP: CategoryAge[] = [
  // Femmes
  { label: 'Féminine ancien', value: 'FA', gender: 'F' },
  { label: 'Féminine super vétéran', value: 'FSV', gender: 'F' },
  { label: 'Féminine vétéran', value: 'FV', gender: 'F' },
  { label: 'Féminine sénior', value: 'FS', gender: 'F' },
  { label: 'Féminine espoir', value: 'FE', gender: 'F' },
  { label: 'Féminine jeune', value: 'FJ', gender: 'F' },
  { label: 'Féminine cadet', value: 'FC', gender: 'F' },
  { label: 'Féminine minime', value: 'FM', gender: 'F' },
  { label: 'NC', value: 'NC', gender: 'F' },
  // Hommes
  { label: 'Ancien', value: 'A', gender: 'H' },
  { label: 'Super Vétéran', value: 'SV', gender: 'H' },
  { label: 'Vétéran', value: 'V', gender: 'H' },
  { label: 'Sénior', value: 'S', gender: 'H' },
  { label: 'Espoir', value: 'E', gender: 'H' },
  { label: 'Jeune', value: 'J', gender: 'H' },
  { label: 'Cadet', value: 'C', gender: 'H' },
  { label: 'Minime', value: 'M', gender: 'H' },
  { label: 'NC', value: 'NC', gender: 'H' },
];

export const FEDERATIONS: Record<FedeEnum, Federation> = {
  [FedeEnum.FSGT]: {
    name: { label: 'FSGT', value: FedeEnum.FSGT },
    catev: [...CATEV_BASE],
    catea: CATEA_FSGT,
  },
  [FedeEnum.UFOLEP]: {
    name: { label: 'UFOLEP', value: FedeEnum.UFOLEP },
    catev: [...CATEV_UFOLEP],
    catea: CATEA_UFOLEP,
  },
  [FedeEnum.FFC]: {
    name: { label: 'FFC', value: FedeEnum.FFC },
    catev: [
      ...CATEV_BASE,
      { label: 'Open 1', value: 'OPEN1', competitionTypes: ALL_COMPETITION_TYPES },
      { label: 'Open 2', value: 'OPEN2', competitionTypes: ALL_COMPETITION_TYPES },
      { label: 'Open 3', value: 'OPEN3', competitionTypes: ALL_COMPETITION_TYPES },
      { label: 'Access 1', value: 'ACCESS1', competitionTypes: ALL_COMPETITION_TYPES },
      { label: 'Access 2', value: 'ACCESS2', competitionTypes: ALL_COMPETITION_TYPES },
      { label: 'Access 3', value: 'ACCESS3', competitionTypes: ALL_COMPETITION_TYPES },
      { label: 'Access 4', value: 'ACCESS4', competitionTypes: ALL_COMPETITION_TYPES },
    ],
    catea: CATEA_FSGT,
  },
  [FedeEnum.FFTRI]: {
    name: { label: 'Fédération Triathlon', value: FedeEnum.FFTRI },
    catev: [...CATEV_BASE],
    catea: CATEA_FSGT,
  },
  [FedeEnum.FFVELO]: {
    name: { label: 'FF Vélo', value: FedeEnum.FFVELO },
    catev: [...CATEV_BASE],
    catea: CATEA_FSGT,
  },
  [FedeEnum.CYCLOS]: {
    name: { label: 'Cyclos', value: FedeEnum.CYCLOS },
    catev: [...CATEV_BASE],
    catea: CATEA_FSGT,
  },
  [FedeEnum.NL]: {
    name: { label: 'Non Licencié', value: FedeEnum.NL },
    catev: [...CATEV_BASE],
    catea: CATEA_FSGT,
  },
};

export const FEDERATION_OPTIONS = Object.values(FedeEnum).map(fede => ({
  value: FEDERATIONS[fede].name.value,
  label: FEDERATIONS[fede].name.label,
}));

/**
 * Récupère les catégories de valeur pour une fédération
 * filtrées par type de compétition (ROUTE/VTT par défaut)
 */
export const getCatevOptions = (fede: string, competitionType: CompetitionType = 'ROUTE') => {
  const federation = FEDERATIONS[fede as FedeEnum];
  if (!federation) return [];

  return federation.catev
    .filter(cat => cat.competitionTypes.includes(competitionType))
    .map(cat => ({ value: cat.value, label: cat.label }));
};

/**
 * Récupère les catégories de valeur CX pour une fédération
 */
export const getCatevCXOptions = (fede: string) => {
  const federation = FEDERATIONS[fede as FedeEnum];
  if (!federation) return [];

  return federation.catev
    .filter(cat => cat.competitionTypes.includes('CX'))
    .map(cat => ({ value: cat.value, label: cat.label }));
};

/**
 * Récupère les catégories d'âge pour une fédération filtrées par genre
 */
export const getCateaOptions = (fede: string, gender: string) => {
  const federation = FEDERATIONS[fede as FedeEnum];
  if (!federation) return [];

  return federation.catea
    .filter(cat => cat.gender === gender)
    .map(cat => ({ value: cat.value, label: `${cat.label} (${cat.value})` }));
};

/**
 * Helper texts pour les champs du formulaire
 */
export const FIELD_HELPER_TEXTS = {
  name: "En majuscule, ne pas utiliser de caractères accentués. Pour les noms composés, mettre un tiret sans espace.",
  firstName: {
    FSGT: "Première lettre en majuscule, puis le reste en minuscule (Ex: Jean-Paul)",
    default: "Tout en majuscule, ne pas utiliser les caractères accentués (Ex: JEAN-PAUL)",
  },
  club: {
    UFOLEP: "En majuscule, ne pas utiliser de caractères accentués",
    FFC: "En majuscule, ne pas utiliser de caractères accentués",
    default: "Première lettre en majuscule, puis le reste en minuscule",
  },
  birthYear: `Année entre ${new Date().getFullYear() - 130} et ${new Date().getFullYear() - 4}`,
  dept: "",
  saison: "Année de la saison sportive (ex: 2025)",
  catea: "Sélectionnez d'abord un genre et une année de naissance",
};

/**
 * Vérifie si une fédération est "Non Licencié"
 */
export const isNonLicencie = (fede: string | undefined) => fede === FedeEnum.NL;

/**
 * Options multi-select pour le filtre par département (tous les départements français)
 */
export const DEPT_FILTER_OPTIONS: { value: string; label: string }[] = [
  ...Array.from({ length: 19 }, (_, i) => {
    const code = String(i + 1).padStart(2, '0');
    return { value: code, label: code };
  }),
  { value: '2A', label: '2A' },
  { value: '2B', label: '2B' },
  ...Array.from({ length: 75 }, (_, i) => {
    const code = String(i + 21).padStart(2, '0');
    return { value: code, label: code };
  }),
  ...['971', '972', '973', '974', '976'].map(c => ({ value: c, label: c })),
];

/**
 * Options multi-select pour le filtre par fédération
 */
export const FEDE_FILTER_OPTIONS: { value: string; label: string }[] = Object.values(FedeEnum).map(f => ({
  value: f,
  label: f,
}));
