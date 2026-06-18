export type UserType = {
  id: number;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string;
  /**
   * UID Firebase Auth — set uniquement pour les users mobile firebase.
   * Quand renseigné, la row est en lecture seule côté backoffice :
   * Firebase Auth est la source de vérité pour ces users.
   */
  firebaseUid?: string | null;
  /**
   * Métadonnées Firebase Auth (users Dossardeur uniquement) — non persistées
   * en base, enrichies à la volée par le backend. Chaînes de date UTC.
   */
  creationTime?: string | null;
  lastSignInTime?: string | null;
};

export type CreateUserInput = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: string;
  password: string;
};

/**
 * Origine du compte : 'dossardeur' = users mobile Firebase (firebaseUid
 * renseigné), 'opendossard' = users backoffice. Miroir de l'enum backend
 * `UserSource` (filter-user.dto.ts).
 */
export type UserSource = 'dossardeur' | 'opendossard';

export type UserPaginationParams = {
  offset?: number;
  limit?: number;
  search?: string;
  source?: UserSource;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};

export type { PaginationMeta, PaginatedResponse } from './pagination';
