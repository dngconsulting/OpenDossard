import type { CompetitionTypeEnum } from './competitions';

// Challenge DTO - corresponds to ChallengeEntity from api-v1
export type ChallengeType = {
  id: number;
  name: string;
  description?: string;
  competitionIds: number[];
  active: boolean;
  reglement?: string;
  competitionType: CompetitionTypeEnum;
};

// Individual race result for a rider in a challenge
export type ChallengeRaceRow = {
  name?: string;
  firstName?: string;
  competitionName?: string;
  club?: string;
  catev?: string;
  catea?: string;
  dept?: string;
  fede?: string;
  gender?: string;
  rankingScratch?: number;
  competitionId?: number;
  comment?: string;
  eventDate?: string;
  sprintchallenge?: boolean;
  licenceId?: string;
  ptsRace?: number;
  nbParticipants?: number;
  explanation?: string;
};

// Rider's challenge ranking - aggregated data
export type ChallengeRider = {
  licenceId?: string;
  name?: string;
  firstName?: string;
  gender?: string;
  catev?: string;
  catea?: string;
  challengeRaceRows?: ChallengeRaceRow[];
  ptsAllRaces?: number;
  currentLicenceCatev?: string;
  currentLicenceCatea?: string;
  currentClub?: string;
  explanation?: string;
};

// Gender type for filtering
export type GenderType = 'H' | 'F';

// Category type for filtering (1-5 for road, plus DAMES for CX)
export type CategoryType = '1' | '2' | '3' | '4' | '5' | 'DAMES';
