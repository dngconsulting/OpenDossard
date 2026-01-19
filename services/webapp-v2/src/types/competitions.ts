import type { PaginationMeta, PaginationParams } from './licences';

export type CompetitionType = {
  id: number;
  eventDate: string;
  name: string;
  zipCode: string;
  fede: string;
  competitionType: string;
  club?: {
    id: number;
    longName: string;
    shortName: string;
  };
  races: string;
  dept?: string;
  engagementsCount: number;
  classementsCount: number;
};

export type CompetitionFilters = Partial<Record<keyof CompetitionType, string>>;

export type CompetitionPaginationParams = PaginationParams & {
  filters?: CompetitionFilters;
  // Filtres avancés
  fedes?: string;
  competitionTypes?: string;
  depts?: string;
  displayPast?: string;
  displayFuture?: string;
  startDate?: string;
  endDate?: string;
};

export type PaginatedCompetitionResponse = {
  data: CompetitionType[];
  meta: PaginationMeta;
};
