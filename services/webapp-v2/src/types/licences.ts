import type { PaymentSummary } from './payments';

export type LicenceType = {
  id: number;
  licenceNumber: string;
  name: string;
  firstName: string;
  club: string;
  gender: string;
  dept: string;
  birthYear: string;
  catea: string;
  catev: string;
  catevCX: string;
  fede: 'FSGT' | 'FFTRI' | 'FFVELO' | 'UFOLEP' | 'FFCYCLISME' | 'FFC' | 'NL';
  saison: string;
  author?: string;
  lastChanged?: string;
  comment?: string;
  racesCount?: number;
  /**
   * Paiement HelloAsso le plus récent pour cette licence sur la compétition
   * scope (présent uniquement si l'appel `GET /licences?...&competitionId=X`
   * fournit `competitionId`). `null` quand aucune transaction n'existe.
   */
  helloAssoPayment?: PaymentSummary | null;
};

export type LicenceFilters = Partial<Record<keyof LicenceType, string>>;

export type PaginationParams = {
  offset?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: LicenceFilters;
  /** Active la jointure `helloAssoPayment` côté backend pour cette compétition. */
  competitionId?: number;
};

export type { PaginationMeta, PaginatedResponse } from './pagination';
