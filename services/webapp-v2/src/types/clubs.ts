export type ClubType = {
  id: number;
  shortName: string | null;
  longName: string;
  dept: string | null;
  elicenceName: string | null;
  fede: string | null;
  helloAssoSlug: string | null;
  author?: string | null;
  lastChanged?: string | null;
};

export type UpdateClubInput = {
  shortName?: string | null;
  longName?: string;
  elicenceName?: string | null;
  dept?: string | null;
  helloAssoSlug?: string | null;
  propagate?: boolean;
};

export type ClubReferences = {
  raceCount: number;
  licenceCount: number;
  competitionCount: number;
};

export type ClubFilters = Partial<Record<keyof ClubType, string>>;

export type ClubPaginationParams = {
  offset?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: ClubFilters;
};

/**
 * Scope d'édition/suppression de clubs pour l'utilisateur courant.
 * - `ALL` : ADMIN, accès non scopé (peut éditer/supprimer tout club).
 * - `SCOPED` : ORGA (ou autre rôle non-ADMIN), `clubIds` liste exhaustive
 *   des clubs auxquels il est lié.
 */
export type AccessibleClubsScope =
  | { scope: 'ALL' }
  | { scope: 'SCOPED'; clubIds: number[] };
