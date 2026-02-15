export type ClubType = {
  id: number;
  shortName: string | null;
  longName: string;
  dept: string | null;
  elicenceName: string | null;
  fede: string | null;
};

export type UpdateClubInput = {
  shortName?: string;
  longName?: string;
  elicenceName?: string;
  dept?: string;
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
