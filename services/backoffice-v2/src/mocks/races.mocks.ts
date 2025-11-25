import type { RaceType } from '@/types/races.ts';

export const races: RaceType[] = [
  {
    id: '1234',
    engagedCount: 120,
    date: '2024-06-15',
    name: 'Grand Prix de la Ville',
    zip: '06000',
    club: 'ASPTT NICE',
    categories: [
      {
        id: '1',
        name: 'Elite Hommes',
        startTime: '09:00',
        registerTime: '08:00',
        gpx: 'https://example.com/gpx/elite-hommes.gpx',
        laps: 10,
        totalDistance: 120
      },
      {
        id: '2',
        name: 'Elite Femmes',
        startTime: '11:00',
        registerTime: '10:00',
        gpx: 'https://example.com/gpx/elite-femmes.gpx',
        laps: 8,
        totalDistance: 96
      },
      {
        id: '3',
        name: 'Espoirs',
        startTime: '13:00',
        registerTime: '12:00',
        gpx: 'https://example.com/gpx/espoirs.gpx',
        laps: 6,
        totalDistance: 72
      }
    ],
    federation: 'FSGT',
  },
  {
    id: '1235',
    engagedCount: 85,
    date: '2024-07-20',
    name: "Tour de la Côte d'Azur",
    zip: '06100',
    club: 'VELO CLUB DE NICE',
    categories: [
      {
        id: '1',
        name: 'Course Longue',
        startTime: '08:30',
        registerTime: '07:30',
        gpx: 'https://example.com/gpx/course-longue.gpx',
        totalDistance: 150
      },
      {
        id: '2',
        name: 'Course Courte',
        startTime: '10:30',
        registerTime: '09:30',
        gpx: 'https://example.com/gpx/course-courte.gpx',
        totalDistance: 75
      }
    ],
    federation: 'FFVELO',
  },
  {
    id: '1236',
    engagedCount: 150,
    date: '2024-08-10',
    name: 'Critérium des Alpes-Maritimes',
    zip: '06200',
    club: 'CYCLISME CLUB NICE',
    categories: [
      {
        id: '1',
        name: 'Pro',
        startTime: '09:00',
        registerTime: '08:00',
        gpx: 'https://example.com/gpx/pro.gpx',
        laps: 12,
        totalDistance: 144
      },
      {
        id: '2',
        name: 'Elite',
        startTime: '11:00',
        registerTime: '10:00',
        gpx: 'https://example.com/gpx/elite.gpx',
        laps: 10,
        totalDistance: 120
      },
      {
        id: '3',
        name: 'Master',
        startTime: '13:00',
        registerTime: '12:00',
        gpx: 'https://example.com/gpx/master.gpx',
        laps: 8,
        totalDistance: 96
      },
      {
        id: '4',
        name: 'Jeunes',
        startTime: '15:00',
        registerTime: '14:00',
        gpx: 'https://example.com/gpx/jeunes.gpx',
        laps: 5,
        totalDistance: 60
      }
    ],
    federation: 'FFC',
  },
];
