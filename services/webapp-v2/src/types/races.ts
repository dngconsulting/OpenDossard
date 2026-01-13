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
