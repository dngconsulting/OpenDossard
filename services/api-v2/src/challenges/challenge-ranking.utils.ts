import { ChallengeRiderDto } from './dto/challenge-ranking.dto';

export type RankedChallengeRider = ChallengeRiderDto & { rank: number };

/**
 * Dernière épreuve courue dans la catégorie du groupe : date la plus récente,
 * puis identifiant le plus grand si deux épreuves tombent le même jour.
 * Les lignes d'une autre catégorie sont ignorées : leur place scratch est
 * numérotée dans une autre course et n'est pas comparable.
 */
function lastCompetitionId(group: ChallengeRiderDto[], catev: string): number | null {
  let last: { time: number; competitionId: number } | null = null;
  for (const row of group.flatMap(r => r.challengeRaceRows)) {
    if (row.catev !== catev) continue;
    const time = new Date(row.eventDate).getTime();
    if (
      !last ||
      time > last.time ||
      (time === last.time && row.competitionId > last.competitionId)
    ) {
      last = { time, competitionId: row.competitionId };
    }
  }
  return last?.competitionId ?? null;
}

/** Place du coureur à cette épreuve dans sa catégorie, `null` s'il n'y est pas classé (absent, DNF, DNS…). */
function placeAt(rider: ChallengeRiderDto, competitionId: number | null): number | null {
  const row = rider.challengeRaceRows.find(
    r =>
      r.competitionId === competitionId &&
      r.catev === rider.currentLicenceCatev &&
      r.rankingScratch != null &&
      !r.comment,
  );
  return row ? Number(row.rankingScratch) : null;
}

/** Règlement : « Le classement de la dernière épreuve prévaudra pour départager les ex-æquo ». */
function compareLastRace(a: number | null, b: number | null): number {
  if (a !== null && b !== null) return a - b;
  if (a !== null) return -1;
  if (b !== null) return 1;
  return 0;
}

/** Ordre croissant des catégories, catégorie absente (null) en dernier comme `_.orderBy`. */
function compareAsc(a: string | null | undefined, b: string | null | undefined): number {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Rang par (sexe, catégorie courante) : points décroissants, puis départage
 * strict sur la dernière épreuve courue dans la catégorie. Sinon ex æquo (1, 1, 3).
 */
export function rankRiders(riders: ChallengeRiderDto[]): RankedChallengeRider[] {
  const groups = new Map<string, ChallengeRiderDto[]>();
  for (const rider of riders) {
    const key = `${rider.gender}|${rider.currentLicenceCatev}`;
    const group = groups.get(key);
    if (group) group.push(rider);
    else groups.set(key, [rider]);
  }

  const ranked = [...groups.values()].flatMap(group => {
    const lastId = lastCompetitionId(group, group[0].currentLicenceCatev);
    const entries = group
      .map(rider => ({ rider, place: placeAt(rider, lastId) }))
      .sort(
        (a, b) => b.rider.ptsAllRaces - a.rider.ptsAllRaces || compareLastRace(a.place, b.place),
      );

    let rank = 0;
    return entries.map((entry, i) => {
      const prev = entries[i - 1];
      const tied =
        prev !== undefined &&
        prev.rider.ptsAllRaces === entry.rider.ptsAllRaces &&
        compareLastRace(prev.place, entry.place) === 0;
      if (!tied) rank = i + 1;
      return { ...entry.rider, rank };
    });
  });

  // Catégorie croissante, puis points décroissants, puis rang croissant (tri stable).
  return ranked.sort(
    (a, b) =>
      compareAsc(a.currentLicenceCatev, b.currentLicenceCatev) ||
      b.ptsAllRaces - a.ptsAllRaces ||
      a.rank - b.rank,
  );
}

/** Nombre de coureurs archivés par (sexe, catégorie) à la clôture : volumétrie maîtrisée. */
export const ARCHIVE_TOP_N = 20;

/** Coureurs de rang ≤ n dans leur groupe. Les ex æquo au n-ième rang sont tous conservés. */
export function keepTop(riders: RankedChallengeRider[], n: number): RankedChallengeRider[] {
  return riders.filter(r => r.rank <= n);
}

/** Le rang n'est pas exposé dans le DTO (contrat inchangé) : les clients affichent `index + 1`. */
export function withoutRank(riders: RankedChallengeRider[]): ChallengeRiderDto[] {
  return riders.map(({ rank: _rank, ...rider }) => rider);
}
