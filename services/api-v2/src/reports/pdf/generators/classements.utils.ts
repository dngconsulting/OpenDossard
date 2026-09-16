import { RaceRowDto } from '../../../races/dto/race-row.dto';

/**
 * Port serveur de `services/webapp-v2/src/utils/classements.ts`
 * (transformRows / rankOfCate) — même sémantique, sans DOM.
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
  catev: string | null;
  catea: string | null;
  fede: string | null;
  chrono: string | null;
  tours: number | null;
  sprintchallenge: boolean;
  rankOfCate: number | null;
};

const isRanked = (r: RaceRowDto): boolean => r.rankingScratch != null && r.comment == null;
const byScratch = (a: RaceRowDto, b: RaceRowDto): number =>
  (a.rankingScratch ?? 0) - (b.rankingScratch ?? 0);

/**
 * Rang dans la catégorie : femmes classées entre elles toutes catégories
 * confondues, hommes classés dans leur `catev`. null si non classé ou abandon.
 */
export function rankOfCate(row: RaceRowDto, allRows: RaceRowDto[]): number | null {
  if (!isRanked(row)) return null;
  const valid = allRows.filter(isRanked).sort(byScratch);
  const pool =
    row.gender === 'F'
      ? valid.filter(r => r.gender === 'F')
      : valid.filter(r => r.catev === row.catev);
  const index = pool.findIndex(r => r.id === row.id);
  return index >= 0 ? index + 1 : null;
}

/** Lignes d'une course : classés (par scratch), puis lignes vides, puis abandons. */
export function transformRows(rows: RaceRowDto[], raceCode: string): TransformedRow[] {
  const raceRows = rows.filter(r => r.raceCode === raceCode);
  if (raceRows.length === 0) return [];

  const classed = raceRows.filter(isRanked).sort(byScratch);
  const dnf = raceRows.filter(r => r.comment != null);
  const allRanked = [...classed, ...dnf];
  const emptyCount = raceRows.length - classed.length - dnf.length;

  const toRow = (r: RaceRowDto, position: number): TransformedRow => ({
    position,
    id: r.id,
    riderNumber: r.riderNumber ?? null,
    rankingScratch: r.rankingScratch ?? null,
    comment: r.comment ?? null,
    name: r.name ?? r.riderName ?? null,
    club: r.club ?? null,
    gender: r.gender ?? null,
    catev: r.catev ?? null,
    catea: r.catea ?? null,
    fede: r.fede ?? null,
    chrono: r.chrono ?? null,
    tours: r.tours ?? null,
    sprintchallenge: r.sprintchallenge ?? false,
    rankOfCate: rankOfCate(r, allRanked),
  });

  const emptyRow = (position: number): TransformedRow => ({
    position,
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

  const out: TransformedRow[] = [];
  let pos = 1;
  for (const r of classed) out.push(toRow(r, pos++));
  for (let i = 0; i < emptyCount; i++) out.push(emptyRow(pos++));
  for (const r of dnf) out.push(toRow(r, pos++));
  return out;
}

/** Dossard sur 3 chiffres (« 005 »). */
export function displayDossard(num: string | number): string {
  return String(num).padStart(3, '0');
}

/** Vainqueur(s) du challenge sprint : « NOM Prénom (club), … » ou « NC ». */
export function getChallengeWinners(rows: TransformedRow[]): string {
  const winners = rows.filter(r => r.sprintchallenge && r.name);
  if (winners.length === 0) return 'NC';
  return winners.map(w => `${w.name} (${w.club ?? 'NC'})`).join(', ');
}
