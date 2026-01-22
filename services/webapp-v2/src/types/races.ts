import type { FederationType, CompetitionTypeEnum } from './competitions';

/**
 * DTO d'engagement (création)
 */
export type CreateEngagementDto = {
  competitionId: number;
  licenceId: number;
  raceCode: string;
  riderNumber: number;
  catev: string;
  catea?: string;
  club?: string;
  rankingScratch?: number;
};

/**
 * RaceRow enrichi (réponse API)
 */
export type RaceRowType = {
  id: number;
  raceCode: string;
  catev: string;
  catea?: string;
  chrono?: string;
  tours?: number;
  riderNumber: number;
  rankingScratch?: number;
  numberMin?: number;
  numberMax?: number;
  licenceId: number;
  licenceNumber?: string;
  sprintchallenge?: boolean;
  comment?: string;
  competitionId: number;
  competitionName?: string;
  competitionDate?: string;
  competitionType?: CompetitionTypeEnum;
  competitionRaces?: string[];
  name: string;
  riderName?: string;
  club?: string;
  gender?: string;
  dept?: string;
  fede?: FederationType;
  birthYear?: string;
  surclassed?: boolean;
};

/**
 * Palmarès d'un coureur
 */
export type PalmaresRowType = RaceRowType & {
  rankingInCategory?: number;
};

/**
 * DTO pour mise à jour du classement
 */
export type UpdateRankingDto = {
  riderNumber: number;
  raceCode: string;
  competitionId: number;
  rankingScratch?: number;
  comment?: string;
};

/**
 * DTO pour suppression du classement
 */
export type RemoveRankingDto = {
  id: number;
  raceCode: string;
  competitionId: number;
};

// Legacy types for backward compatibility
export type EngagedRider = {
  id: string;
  licenceId: string;
  bibNumber: string;
  name: string;
  club: string;
  gender: 'H' | 'F';
  dept: string;
  category: string;
};

export type RaceResult = {
  id: string;
  engagedRiderId: string;
  bibNumber: string;
  rank: number;
  chrono: string;
  name: string;
  club: string;
  gender: 'H' | 'F';
  dept: string;
  category: string;
};

export type RaceCategory = {
  id: string;
  name: string;
  startTime: string;
  registerTime: string;
  gpx: string;
  laps?: number;
  totalDistance: number;
  engagedRiders: EngagedRider[];
  results: RaceResult[];
};

export type RaceType = {
  id: string;
  engagedCount: number;
  date: string;
  name: string;
  zip: string;
  club: string;
  categories: RaceCategory[];
  federation: 'FSGT' | 'FFTRI' | 'FFVELO' | 'UFOLEP' | 'FFCYCLISME' | 'FFC';
  podiumGPS?: string;
};
