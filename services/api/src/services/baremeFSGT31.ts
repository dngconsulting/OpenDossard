export const baremeByCateFSGT31 = [
  {
    catev: "1",
    ptsParticipation: 50,
    ptsBareme: (ranking: number): number =>
      ranking <= 10
        ? [400, 370, 340, 310, 290, 270, 250, 240, 230, 220][ranking - 1]
        : 0
  },
  {
    catev: "2",
    ptsParticipation: 40,
    ptsBareme: (ranking: number): number =>
      ranking <= 10
        ? [300, 280, 260, 240, 210, 200, 190, 170, 160, 150][ranking - 1]
        : 0
  },
  {
    catev: "3",
    ptsParticipation: 30,
    ptsBareme: (ranking: number): number =>
      ranking <= 10
        ? [160, 140, 120, 110, 100, 90, 80, 70, 60, 50][ranking - 1]
        : 0
  },
  {
    catev: "4",
    ptsParticipation: 20,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [80, 70, 60, 55, 50, 45, 40, 35, 30, 25][ranking - 1] : 0
  },
  {
    catev: "5",
    ptsParticipation: 10,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [40, 35, 30, 25, 20, 18, 16, 14, 12, 10][ranking - 1] : 0
  },
  {
    catev: "6",
    ptsParticipation: 5,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [20, 15, 12, 10, 8, 6, 4, 3, 2, 1][ranking - 1] : 0
  },
  {
    catev: "C",
    ptsParticipation: 10,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [40, 35, 30, 25, 20, 18, 16, 14, 12, 10][ranking - 1] : 0
  },
  {
    catev: "M",
    ptsParticipation: 10,
    ptsBareme: (ranking: number): number =>
      ranking <= 10 ? [40, 35, 30, 25, 20, 18, 16, 14, 12, 10][ranking - 1] : 0
  }
];
