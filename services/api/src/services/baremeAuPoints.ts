export const baremeAuPoints = {
  ptsBareme: (ranking: number): number =>
    ranking <= 5 ? [8, 5, 3, 2, 1][ranking - 1] : 0,
  coef: (nbParticipants: number) => {
    if (nbParticipants > 0 && nbParticipants <= 9) {
      return 0.8;
    }
    if (nbParticipants >= 10 && nbParticipants <= 15) {
      return 1;
    }
    if (nbParticipants >= 16 && nbParticipants <= 20) {
      return 1.2;
    }
    if (nbParticipants > 20) {
      return 1.4;
    }
  }
};
