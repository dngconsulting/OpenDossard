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
  // Champs calculés par GET /clubs (liste paginée uniquement).
  /** Date de liaison HelloAsso (ISO). null/absent = club non lié. */
  helloAssoLinkedAt?: string | null;
  /** Expiration du refresh token HelloAsso (ISO). Passée = liaison expirée. */
  helloAssoRefreshTokenExpiresAt?: string | null;
  /** true si le club a au moins une épreuve, passée ou à venir. */
  organizer?: boolean;
};

export type HelloAssoLinkFilter = 'linked' | 'unlinked';

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

/**
 * Clés de filtre serveur de la page clubs : les colonnes filtrables + 2 filtres
 * hors colonne. Valeurs toujours en chaîne (URL) : `organizer` vaut `'true'`
 * ou est absent, `helloAsso` vaut `'linked'` | `'unlinked'` ou est absent.
 */
export type ClubFilterKey = keyof ClubType | 'helloAsso' | 'organizer';
export type ClubFilters = Partial<Record<ClubFilterKey, string>>;

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
