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
};

export type CreateUserInput = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: string;
  password: string;
};

export type UserPaginationParams = {
  offset?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};

export type { PaginationMeta, PaginatedResponse } from './pagination';
