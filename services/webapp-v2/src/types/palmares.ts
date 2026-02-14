import type { LicenceType } from '@/types/licences';

export type RiderStats = {
  totalRaces: number;
  wins: number;
  podiums: number;
  topTen: number;
  bestRanking: number;
};

export type CategoryChange = {
  season: string;
  fromCategory: string | null;
  toCategory: string;
  direction: 'up' | 'down' | 'initial';
};

export type PalmaresRaceResult = {
  id: number;
  competitionId: number;
  date: string;
  competitionName: string;
  competitionType: string;
  raceCode: string;
  catev: string;
  catea: string | null;
  club: string | null;
  rankingScratch: number | null;
  rankingInCategory: number | null;
  totalInCategory: number;
  comment: string | null;
};

export type PalmaresData = {
  licence: LicenceType;
  stats: RiderStats;
  categoryHistoryRoute: CategoryChange[];
  categoryHistoryCX: CategoryChange[];
  results: PalmaresRaceResult[];
};
