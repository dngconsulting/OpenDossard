export type EngagementChartData = {
  date: string;
  fsgt: number;
  ffc: number;
  ufolep: number;
};

export type DashboardStats = {
  totalLicenses: number
  totalLicensesTrend: number
  fsgtLicenses: number
  fsgtLicensesTrend: number
  totalCompetitions: number
}

export type DashboardData = {
  stats: DashboardStats
  engagementChart: EngagementChartData[]
}
