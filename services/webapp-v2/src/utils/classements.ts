import type { RaceRowType } from '@/types/races';

/**
 * Couleurs des médailles pour les podiums
 */
const MEDAL_COLORS = {
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

  // Séparer classés (avec rankingScratch, sans comment DNF) et DNF (avec comment)
  const classedOnly = raceEngagements
    .filter((e) => e.rankingScratch != null && e.comment == null)
    .sort((a, b) => (a.rankingScratch ?? 0) - (b.rankingScratch ?? 0));

  const dnfOnly = raceEngagements
    .filter((e) => e.comment != null);

  // Tous les classés (pour le calcul de rankOfCate)
  const allRanked = [...classedOnly, ...dnfOnly];

  // Nombre total de lignes = nombre d'engagés
  const totalLines = raceEngagements.length;
  const emptyCount = totalLines - classedOnly.length - dnfOnly.length;

  // Ordre : classés → lignes vides → DNF
  const rows: TransformedRow[] = [];

  const toRow = (e: RaceRowType, position: number): TransformedRow => ({
    position,
    id: e.id,
    riderNumber: e.riderNumber,
    rankingScratch: e.rankingScratch ?? null,
    comment: e.comment ?? null,
    name: e.name ?? e.riderName ?? null,
    club: e.club ?? null,
    gender: e.gender ?? null,
    dept: e.dept ?? null,
    catev: e.catev ?? null,
    catea: e.catea ?? null,
    fede: e.fede ?? null,
    birthYear: e.birthYear ?? null,
    chrono: e.chrono ?? null,
    tours: e.tours ?? null,
    sprintchallenge: e.sprintchallenge ?? false,
    licenceNumber: e.licenceNumber ?? null,
    rankOfCate: rankOfCate(e, allRanked),
  });

  let pos = 1;

  // 1. Classés
  for (const e of classedOnly) {
    rows.push(toRow(e, pos++));
  }

  // 2. Lignes vides
  for (let i = 0; i < emptyCount; i++) {
    rows.push({
      position: pos++,
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

  // 3. DNF (ABD, NC, CHT...) tout en bas
  for (const e of dnfOnly) {
    rows.push(toRow(e, pos++));
  }

  return rows;
}

/**
 * Une entrée de podium : une ligne classée avec son rang dans sa catégorie
 */
export type PodiumEntry = TransformedRow & { rankInCate: number };

/**
 * Un groupe de podium = un classement par catégorie au sein d'un départ.
 * - `raceCode` : le départ (peut être une catégorie « exotique » ex: « Cadets »)
 * - `categoryLabel` : la catégorie réelle des coureurs (`catev`) ou « Dames »
 * - `entries` : les 3 premiers de ce groupe, triés par rang
 */
export type PodiumGroup = {
  raceCode: string;
  categoryLabel: string;
  isWomen: boolean;
  entries: PodiumEntry[];
  challengeWinner: TransformedRow | null;
};

/**
 * Calcule les podiums de TOUS les départs.
 *
 * Contrairement à un filtrage par `catev`, on itère sur les DÉPARTS (`raceCode`)
 * puis on regroupe par catégorie réelle des coureurs. Cela permet aux podiums
 * de sortir même pour des départs dont le nom n'est pas une catégorie officielle
 * (« exotiques », ex: « Cadets » avec des coureurs en catev « C » et « 3 »).
 *
 * On réutilise `transformRows`/`rankOfCate` : mêmes rangs que le classement affiché
 * (hommes classés au sein de leur `catev`, femmes classées entre toutes les femmes du départ).
 */
export function computePodiums(
  engagements: RaceRowType[],
  races: string[]
): PodiumGroup[] {
  const groups: PodiumGroup[] = [];

  for (const raceCode of races) {
    const ranked = transformRows(engagements, raceCode).filter(
      (r) => r.rankingScratch != null && r.comment == null && r.rankOfCate != null
    );

    if (ranked.length === 0) {
      continue;
    }

    // Le vainqueur du challenge est unique par départ
    const challengeWinner = ranked.find((r) => r.sprintchallenge) ?? null;

    // Hommes regroupés par catégorie réelle (catev), femmes dans un groupe « Dames »
    const menByCate = new Map<string, TransformedRow[]>();
    const women: TransformedRow[] = [];
    for (const r of ranked) {
      if (r.gender === 'F') {
        women.push(r);
      } else {
        const key = r.catev ?? '';
        const bucket = menByCate.get(key);
        if (bucket) {
          bucket.push(r);
        } else {
          menByCate.set(key, [r]);
        }
      }
    }

    const toPodium = (rows: TransformedRow[]): PodiumEntry[] =>
      rows
        .filter((r) => (r.rankOfCate ?? 99) <= 3)
        .sort((a, b) => (a.rankOfCate ?? 0) - (b.rankOfCate ?? 0))
        .map((r) => ({ ...r, rankInCate: r.rankOfCate ?? 0 }));

    const raceGroups: PodiumGroup[] = [];

    const cateKeys = [...menByCate.keys()].sort((a, b) =>
      a.localeCompare(b, 'fr', { numeric: true })
    );
    for (const cate of cateKeys) {
      const entries = toPodium(menByCate.get(cate) ?? []);
      if (entries.length > 0) {
        raceGroups.push({
          raceCode,
          categoryLabel: cate,
          isWomen: false,
          entries,
          challengeWinner: null,
        });
      }
    }

    const womenEntries = toPodium(women);
    if (womenEntries.length > 0) {
      raceGroups.push({
        raceCode,
        categoryLabel: 'Dames',
        isWomen: true,
        entries: womenEntries,
        challengeWinner: null,
      });
    }

    // Le challenge n'est affiché qu'une fois par départ (sur le premier groupe)
    if (raceGroups.length > 0) {
      raceGroups[0].challengeWinner = challengeWinner;
    }

    groups.push(...raceGroups);
  }

  return groups;
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
    'Cl.Caté',
    'Dossard',
    'Nom',
    'Club',
    'Sexe',
    'Dept',
    'Année',
    'CatéV',
    'CatéA',
    ...(avecChrono ? ['Chrono', 'Tours'] : []),
    'Licence',
    'Fédé',
    'Course',
  ];

  const csvRows = rows
    .filter((row) => row.riderNumber != null)
    .map((row) => [
      row.comment ?? row.rankingScratch ?? '',
      row.rankOfCate ?? '',
      row.riderNumber ?? '',
      row.name ?? '',
      row.club ?? '',
      row.gender ?? '',
      row.dept ?? '',
      row.birthYear ?? '',
      row.catev ?? '',
      row.catea ?? '',
      ...(avecChrono ? [row.chrono ?? '', row.tours ?? ''] : []),
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
    'Cl.Caté',
    'Dossard',
    'Nom',
    'Club',
    'Sexe',
    'Dept',
    'Année',
    'CatéV',
    'CatéA',
    ...(avecChrono ? ['Chrono', 'Tours'] : []),
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
        String(row.rankOfCate ?? ''),
        String(row.riderNumber ?? ''),
        row.name ?? '',
        row.club ?? '',
        row.gender ?? '',
        row.dept ?? '',
        row.birthYear ?? '',
        row.catev ?? '',
        row.catea ?? '',
        ...(avecChrono ? [row.chrono ?? '', String(row.tours ?? '')] : []),
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
