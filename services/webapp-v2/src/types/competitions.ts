import type { PaginationMeta, PaginationParams } from './licences';

// Enums matching backend
export const FEDERATION_VALUES = ['FSGT', 'UFOLEP', 'FFC', 'CYCLOS', 'FFVELO', 'NL', 'FFTRI'] as const;
export type FederationType = (typeof FEDERATION_VALUES)[number];

export const COMPETITION_TYPE_VALUES = ['CX', 'ROUTE', 'VTT', 'GRAVEL', 'RANDO'] as const;
export type CompetitionTypeEnum = (typeof COMPETITION_TYPE_VALUES)[number];

// Nested types for JSON fields
export type CompetitionInfoItem = {
  course: string;
  horaireEngagement: string;
  horaireDepart: string;
  info1: string;
  info2: string;
  info3?: string;
};

export type PricingItem = {
  name: string;
  tarif: string;
};

export type LinkItem = {
  label: string;
  link: string;
};

// Full Competition type for detail/edit page
export type CompetitionDetailType = {
  id: number;
  eventDate: string;
  name: string;
  zipCode: string;
  fede: FederationType;
  competitionType: CompetitionTypeEnum;
  club?: {
    id: number;
    longName: string;
    shortName: string;
  };
  clubId?: number;
  races: string;
  categories: string;
  dept?: string;
  info?: string;
  observations?: string;
  competitionInfo?: CompetitionInfoItem[];
  pricing?: PricingItem[];
  longueurCircuit?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  siteweb?: string;
  facebook?: string;
  lieuDossard?: string;
  lieuDossardGPS?: string;
  openedToOtherFede?: boolean;
  openedNL?: boolean;
  avecChrono?: boolean;
  commissaires?: string;
  speaker?: string;
  aboyeur?: string;
  feedback?: string;
  resultsValidated?: boolean;
  photoUrls?: LinkItem[];
  rankingUrls?: LinkItem[];
  registrationUrls?: LinkItem[];
  rankingUrl?: string;
};

// Type for creating/updating a competition
export type CompetitionFormData = Omit<CompetitionDetailType, 'id' | 'club'> & {
  id?: number;
  clubId?: number;
};

// List type (for table display)
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
  startDate?: string;
  endDate?: string;
};

export type PaginatedCompetitionResponse = {
  data: CompetitionType[];
  meta: PaginationMeta;
};
