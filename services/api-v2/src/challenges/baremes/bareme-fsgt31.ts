export const baremeByCateFSGT31 = [
  {
    catev: '1',
    ptsParticipation: 50,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [400, 350, 300, 250, 200, 150, 140, 130, 120, 110][ranking - 1] : 0,
  },
  {
    catev: '2',
    ptsParticipation: 40,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [300, 260, 220, 180, 150, 120, 100, 80, 60, 40][ranking - 1] : 0,
  },
  {
    catev: '3',
    ptsParticipation: 30,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [160, 140, 120, 100, 85, 70, 55, 45, 35, 30][ranking - 1] : 0,
  },
  {
    catev: '4',
    ptsParticipation: 20,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [80, 70, 60, 50, 45, 40, 35, 30, 25, 20][ranking - 1] : 0,
  },
  {
    catev: '5',
    ptsParticipation: 10,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [40, 35, 30, 25, 20, 18, 16, 14, 12, 10][ranking - 1] : 0,
  },
  {
    catev: '6',
    ptsParticipation: 5,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [20, 15, 12, 10, 8, 6, 4, 3, 2, 1][ranking - 1] : 0,
  },
];
