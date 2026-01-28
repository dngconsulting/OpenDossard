export type DashboardStats = {
  totalLicenses: number;
  totalCompetitions: number;
};

export type DashboardData = {
  stats: DashboardStats;
};

export type EngagementChartData = {
  date: string;
  fsgt: number;
  ffc: number;
  ufolep: number;
};

export type DashboardChartFilters = {
  startDate?: string;
  endDate?: string;
  fedes?: string[];
  competitionTypes?: string[];
  competitionDepts?: string[];
  riderDepts?: string[];
  clubs?: string[];
};

export type RidersPerCompetitionItem = {
  name: string;
  count: number;
};

export type ClubParticipationItem = {
  club: string;
  count: number;
};

export type CateaDistributionItem = {
  catea: string;
  count: number;
};

export type CatevDistributionItem = {
  catev: string;
  count: number;
};

export type TopRiderItem = {
  name: string;
  firstName: string;
  club: string;
  count: number;
};
