import type { RaceType } from '@/types/races.ts';

export const races: RaceType[] = [
  {
    id: '1234',
    engagedCount: 120,
    date: '2024-06-15',
    name: 'Grand Prix de la Ville',
    zip: '06000',
    club: 'ASPTT NICE',
    categories: ['1', '2', '3'],
    federation: 'FSGT',
  },
  {
    id: '1235',
    engagedCount: 85,
    date: '2024-07-20',
    name: "Tour de la Côte d'Azur",
    zip: '06100',
    club: 'VELO CLUB DE NICE',
    categories: ['1', '2'],
    federation: 'FFVELO',
  },
  {
    id: '1236',
    engagedCount: 150,
    date: '2024-08-10',
    name: 'Critérium des Alpes-Maritimes',
    zip: '06200',
    club: 'CYCLISME CLUB NICE',
    categories: ['1', '2', '3', '4'],
    federation: 'FFC',
  },
];
