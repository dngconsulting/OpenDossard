import type { CategoryChange, PalmaresData, PalmaresRaceResult } from '@/types/palmares';

import { licences } from './licences.mocks';

const generateResults = (licenceId: string): PalmaresRaceResult[] => {
  const results: PalmaresRaceResult[] = [
    // 2024 ROUTE results
    {
      id: `res-${licenceId}-1`,
      competitionId: '1234',
      date: '2024-06-15',
      competitionName: 'Grand Prix de la Ville',
      competitionType: 'ROUTE',
      category: '1ère catégorie',
      ranking: 1,
      totalParticipants: 45,
    },
    {
      id: `res-${licenceId}-2`,
      competitionId: '1235',
      date: '2024-07-20',
      competitionName: "Tour de la Côte d'Azur",
      competitionType: 'ROUTE',
      category: '1ère catégorie',
      ranking: 3,
      totalParticipants: 62,
    },
    {
      id: `res-${licenceId}-3`,
      competitionId: '1236',
      date: '2024-08-10',
      competitionName: 'Critérium des Alpes-Maritimes',
      competitionType: 'ROUTE',
      category: '1ère catégorie',
      ranking: 8,
      totalParticipants: 38,
    },
    // 2024 CX results
    {
      id: `res-${licenceId}-4`,
      competitionId: '2001',
      date: '2024-10-15',
      competitionName: 'Cyclo-cross de Toulouse',
      competitionType: 'CX',
      category: '1ère catégorie',
      ranking: 2,
      totalParticipants: 28,
    },
    {
      id: `res-${licenceId}-5`,
      competitionId: '2002',
      date: '2024-11-02',
      competitionName: 'Cross des Pyrénées',
      competitionType: 'CX',
      category: '1ère catégorie',
      ranking: 5,
      totalParticipants: 32,
    },
    // 2023 ROUTE results
    {
      id: `res-${licenceId}-6`,
      competitionId: '1100',
      date: '2023-05-20',
      competitionName: 'Classique Printanière',
      competitionType: 'ROUTE',
      category: '2ème catégorie',
      ranking: 1,
      totalParticipants: 52,
    },
    {
      id: `res-${licenceId}-7`,
      competitionId: '1101',
      date: '2023-06-18',
      competitionName: 'Grand Prix des Coteaux',
      competitionType: 'ROUTE',
      category: '2ème catégorie',
      ranking: 2,
      totalParticipants: 48,
    },
    {
      id: `res-${licenceId}-8`,
      competitionId: '1102',
      date: '2023-07-09',
      competitionName: 'Tour du Lauragais',
      competitionType: 'ROUTE',
      category: '2ème catégorie',
      ranking: 4,
      totalParticipants: 55,
    },
    // 2023 CX results
    {
      id: `res-${licenceId}-9`,
      competitionId: '2100',
      date: '2023-10-22',
      competitionName: 'Cyclo-cross de Blagnac',
      competitionType: 'CX',
      category: '2ème catégorie',
      ranking: 1,
      totalParticipants: 25,
    },
    // 2022 ROUTE results
    {
      id: `res-${licenceId}-10`,
      competitionId: '1000',
      date: '2022-06-12',
      competitionName: 'Ronde des Bastides',
      competitionType: 'ROUTE',
      category: '3ème catégorie',
      ranking: 1,
      totalParticipants: 40,
    },
    {
      id: `res-${licenceId}-11`,
      competitionId: '1001',
      date: '2022-07-24',
      competitionName: 'Circuit des Vignes',
      competitionType: 'ROUTE',
      category: '3ème catégorie',
      ranking: 3,
      totalParticipants: 35,
    },
  ];
  return results;
};

const generateCategoryHistory = (): CategoryChange[] => [
  {
    date: '2024-01-15',
    season: '2024',
    fromCategory: '2ème catégorie',
    toCategory: '1ère catégorie',
  },
  {
    date: '2023-02-01',
    season: '2023',
    fromCategory: '3ème catégorie',
    toCategory: '2ème catégorie',
  },
  {
    date: '2022-01-10',
    season: '2022',
    fromCategory: null,
    toCategory: '3ème catégorie',
  },
];

const calculateStats = (results: PalmaresRaceResult[]) => {
  const totalRaces = results.length;
  const wins = results.filter(r => r.ranking === 1).length;
  const podiums = results.filter(r => r.ranking <= 3).length;
  const winRate = totalRaces > 0 ? Math.round((wins / totalRaces) * 100) : 0;
  const avgRanking =
    totalRaces > 0
      ? Math.round((results.reduce((sum, r) => sum + r.ranking, 0) / totalRaces) * 10) / 10
      : 0;
  const bestRanking = totalRaces > 0 ? Math.min(...results.map(r => r.ranking)) : 0;

  return { totalRaces, wins, podiums, winRate, avgRanking, bestRanking };
};

export const palmaresData: Map<string, PalmaresData> = new Map(
  licences.slice(0, 50).map(licence => {
    const results = generateResults(licence.id);
    return [
      licence.id,
      {
        licence,
        stats: calculateStats(results),
        categoryHistory: generateCategoryHistory(),
        results,
      },
    ];
  })
);
