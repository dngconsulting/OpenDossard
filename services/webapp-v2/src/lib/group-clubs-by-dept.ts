import type { ClubType } from '@/types/clubs';

export type DeptGroup = { key: string; label: string; clubs: ClubType[] };

/**
 * Groupe une liste de clubs par code département, en libellant chaque groupe
 * avec le nom français du département (mapping `deptNameByCode`, ex.
 * "Haute-Garonne (31)"). Les clubs sans département vont dans un groupe
 * "Sans département" en queue. Tri : groupes par libellé alpha, clubs
 * intra-groupe par longName alpha.
 *
 * Fonction pure, partagée entre `UserClubsSearchPanel` (résultats) et
 * `LinkedClubsList` (badges).
 */
export function groupClubsByDept(
  clubs: ClubType[],
  deptNameByCode: Map<string, string>,
): DeptGroup[] {
  const byDept = new Map<string, DeptGroup>();
  const noDept: ClubType[] = [];

  for (const club of clubs) {
    if (!club.dept) {
      noDept.push(club);
      continue;
    }
    const existing = byDept.get(club.dept);
    if (existing) {
      existing.clubs.push(club);
    } else {
      const name = deptNameByCode.get(club.dept);
      const label = name ? `${name} (${club.dept})` : `Département ${club.dept}`;
      byDept.set(club.dept, { key: club.dept, label, clubs: [club] });
    }
  }

  byDept.forEach(g => g.clubs.sort((a, b) => a.longName.localeCompare(b.longName)));
  noDept.sort((a, b) => a.longName.localeCompare(b.longName));

  const groups: DeptGroup[] = [...byDept.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  if (noDept.length > 0) {
    groups.push({ key: '__no_dept__', label: 'Sans département', clubs: noDept });
  }
  return groups;
}
