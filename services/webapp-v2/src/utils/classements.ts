import type { RaceRowType } from '@/types/races';

/**
 * Couleurs des médailles pour les podiums
 */
export const MEDAL_COLORS = {
  1: '#efd807', // Or
  2: '#D7D7D7', // Argent
  3: '#6A3805', // Bronze
} as const;

/**
 * Retourne la couleur de la médaille pour un rang donné
 */
export function getMedalColor(rank: number): string | null {
  if (rank >= 1 && rank <= 3) {
    return MEDAL_COLORS[rank as 1 | 2 | 3];
  }
  return null;
}

/**
 * Ligne transformée pour l'affichage dans le tableau des classements
 */
export type TransformedRow = {
  position: number;
  id: number | null;
  riderNumber: number | null;
  rankingScratch: number | null;
  comment: string | null;
  name: string | null;
  club: string | null;
  gender: string | null;
  dept: string | null;
  catev: string | null;
  catea: string | null;
  fede: string | null;
  birthYear: string | null;
  chrono: string | null;
  tours: number | null;
  sprintchallenge: boolean;
  licenceNumber: string | null;
  rankOfCate: number | null;
};

/**
 * Calcule le classement par catégorie d'un coureur
 * - Femmes : classement parmi TOUTES les femmes de la course
 * - Hommes : classement parmi la même catégorie (catev)
 */
export function rankOfCate(
  row: RaceRowType,
  allRankedRows: RaceRowType[]
): number | null {
  if (row.rankingScratch == null || row.comment != null) {
    return null;
  }

  // Filtrer les coureurs valides (classés sans commentaire DNF)
  const validRows = allRankedRows
    .filter((r) => r.rankingScratch != null && r.comment == null)
    .sort((a, b) => (a.rankingScratch ?? 0) - (b.rankingScratch ?? 0));

  if (row.gender === 'F') {
    // Femmes : classement parmi TOUTES les femmes
    const femmes = validRows.filter((r) => r.gender === 'F');
    const index = femmes.findIndex((r) => r.id === row.id);
    return index >= 0 ? index + 1 : null;
  } else {
    // Hommes : classement parmi la même catégorie (catev)
    const sameCate = validRows.filter((r) => r.catev === row.catev);
    const index = sameCate.findIndex((r) => r.id === row.id);
    return index >= 0 ? index + 1 : null;
  }
}

/**
 * Transforme les engagements en lignes pour le tableau des classements
 * Retourne exactement N lignes = N engagés, avec les classés en haut
 */
export function transformRows(
  engagements: RaceRowType[],
  raceCode: string
): TransformedRow[] {
  // Filtrer les engagés de la course
  const raceEngagements = engagements.filter((e) => e.raceCode === raceCode);

  if (raceEngagements.length === 0) {
    return [];
  }

  // Séparer classés (avec rankingScratch ou comment)
  const ranked = raceEngagements
    .filter((e) => e.rankingScratch != null || e.comment != null)
    .sort((a, b) => {
      // DNF (avec comment) en bas des classés
      if (a.comment && !b.comment) return 1;
      if (!a.comment && b.comment) return -1;
      // Sinon tri par rankingScratch
      return (a.rankingScratch ?? 999) - (b.rankingScratch ?? 999);
    });

  // Nombre total de lignes = nombre d'engagés
  const totalLines = raceEngagements.length;

  // Générer les lignes transformées
  const rows: TransformedRow[] = [];

  for (let i = 0; i < totalLines; i++) {
    const rankedRow = ranked[i];

    if (rankedRow) {
      // Ligne avec coureur classé
      rows.push({
        position: i + 1,
        id: rankedRow.id,
        riderNumber: rankedRow.riderNumber,
        rankingScratch: rankedRow.rankingScratch ?? null,
        comment: rankedRow.comment ?? null,
        name: rankedRow.name ?? rankedRow.riderName ?? null,
        club: rankedRow.club ?? null,
        gender: rankedRow.gender ?? null,
        dept: rankedRow.dept ?? null,
        catev: rankedRow.catev ?? null,
        catea: rankedRow.catea ?? null,
        fede: rankedRow.fede ?? null,
        birthYear: rankedRow.birthYear ?? null,
        chrono: rankedRow.chrono ?? null,
        tours: rankedRow.tours ?? null,
        sprintchallenge: rankedRow.sprintchallenge ?? false,
        licenceNumber: rankedRow.licenceNumber ?? null,
        rankOfCate: rankOfCate(rankedRow, ranked),
      });
    } else {
      // Ligne vide (à remplir)
      rows.push({
        position: i + 1,
        id: null,
        riderNumber: null,
        rankingScratch: null,
        comment: null,
        name: null,
        club: null,
        gender: null,
        dept: null,
        catev: null,
        catea: null,
        fede: null,
        birthYear: null,
        chrono: null,
        tours: null,
        sprintchallenge: false,
        licenceNumber: null,
        rankOfCate: null,
      });
    }
  }

  return rows;
}

/**
 * Compte le nombre de coureurs classés dans une course
 */
export function countRanked(engagements: RaceRowType[], raceCode: string): number {
  return engagements.filter(
    (e) => e.raceCode === raceCode && (e.rankingScratch != null || e.comment != null)
  ).length;
}

/**
 * Formate le classement pour l'affichage
 * Ex: "1 (1)" = 1er scratch, 1er de sa catégorie
 * Ex: "ABD" = Abandon
 */
export function formatRanking(row: TransformedRow): string {
  if (row.comment) {
    return row.comment;
  }
  if (row.rankingScratch != null) {
    if (row.rankOfCate != null) {
      return `${row.rankingScratch} (${row.rankOfCate})`;
    }
    return String(row.rankingScratch);
  }
  return String(row.position);
}

/**
 * Export CSV des classements
 */
export function exportClassementsCsv(
  rows: TransformedRow[],
  competitionName: string,
  raceCode: string,
  avecChrono: boolean
): void {
  const headers = [
    'Cl.Scratch',
    'Dossard',
    'Nom',
    'Club',
    'Sexe',
    'Dept',
    'Année',
    'CatéV',
    'CatéA',
    ...(avecChrono ? ['Chrono', 'Tours'] : []),
    'Cl.Caté',
    'Licence',
    'Fédé',
    'Course',
  ];

  const csvRows = rows
    .filter((row) => row.riderNumber != null)
    .map((row) => [
      row.comment ?? row.rankingScratch ?? '',
      row.riderNumber ?? '',
      row.name ?? '',
      row.club ?? '',
      row.gender ?? '',
      row.dept ?? '',
      row.birthYear ?? '',
      row.catev ?? '',
      row.catea ?? '',
      ...(avecChrono ? [row.chrono ?? '', row.tours ?? ''] : []),
      row.rankOfCate ?? '',
      row.licenceNumber ?? '',
      row.fede ?? '',
      raceCode,
    ]);

  const csvContent = [
    headers.join(';'),
    ...csvRows.map((row) => row.join(';')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${competitionName}-${raceCode}-classements.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export CSV de toutes les courses
 */
export function exportAllClassementsCsv(
  engagements: RaceRowType[],
  races: string[],
  competitionName: string,
  avecChrono: boolean
): void {
  const headers = [
    'Cl.Scratch',
    'Dossard',
    'Nom',
    'Club',
    'Sexe',
    'Dept',
    'Année',
    'CatéV',
    'CatéA',
    ...(avecChrono ? ['Chrono', 'Tours'] : []),
    'Cl.Caté',
    'Licence',
    'Fédé',
    'Course',
  ];

  const allRows: string[][] = [];

  for (const raceCode of races) {
    const transformedRows = transformRows(engagements, raceCode);
    const csvRows = transformedRows
      .filter((row) => row.riderNumber != null)
      .map((row) => [
        String(row.comment ?? row.rankingScratch ?? ''),
        String(row.riderNumber ?? ''),
        row.name ?? '',
        row.club ?? '',
        row.gender ?? '',
        row.dept ?? '',
        row.birthYear ?? '',
        row.catev ?? '',
        row.catea ?? '',
        ...(avecChrono ? [row.chrono ?? '', String(row.tours ?? '')] : []),
        String(row.rankOfCate ?? ''),
        row.licenceNumber ?? '',
        row.fede ?? '',
        raceCode,
      ]);
    allRows.push(...csvRows);
  }

  const csvContent = [
    headers.join(';'),
    ...allRows.map((row) => row.join(';')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${competitionName}-tous-classements.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
