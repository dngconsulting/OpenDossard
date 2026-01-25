export const baremeAuPoints = {
  ptsBareme: (ranking: number): number =>
    ranking <= 5 ? [100, 50, 30, 20, 10][ranking - 1] : 0,
  coef: (nbParticipants: number): number => {
    if (nbParticipants === 1) {
      return 1;
    }
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
    return 1;
  },
};
