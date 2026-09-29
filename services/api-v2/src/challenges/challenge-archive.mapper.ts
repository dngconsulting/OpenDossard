import { RankedChallengeRider } from './challenge-ranking.utils';
import { ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { ChallengeArchiveRaceRowEntity } from './entities/challenge-archive-race-row.entity';
import { ChallengeArchiveRiderEntity } from './entities/challenge-archive-rider.entity';

/** Classement live (rang inclus) → entités d'archive, dans l'ordre du classement. */
export function toArchiveEntities(
  challengeId: number,
  ranking: RankedChallengeRider[],
): ChallengeArchiveRiderEntity[] {
  return ranking.map(rider =>
    Object.assign(new ChallengeArchiveRiderEntity(), {
      challengeId,
      licenceId: Number(rider.licenceId),
      gender: rider.gender,
      catev: rider.currentLicenceCatev,
      catea: rider.currentLicenceCatea,
      club: rider.currentClub,
      name: rider.name,
      firstName: rider.firstName,
      ptsAllRaces: rider.ptsAllRaces,
      explanation: rider.explanation ?? null,
      sprintchallenge: rider.sprintchallenge ?? null,
      rank: rider.rank,
      raceRows: rider.challengeRaceRows.map(row =>
        Object.assign(new ChallengeArchiveRaceRowEntity(), {
          competitionId: row.competitionId,
          competitionName: row.competitionName,
          eventDate: row.eventDate,
          catev: row.catev,
          rankingScratch: row.rankingScratch,
          nbParticipants: row.nbParticipants,
          comment: row.comment,
          sprintchallenge: row.sprintchallenge,
          ptsRace: row.ptsRace ?? 0,
          explanation: row.explanation ?? null,
        }),
      ),
    }),
  );
}

/**
 * Entités d'archive → même forme que le live. L'appelant doit fournir les coureurs ET leurs
 * `raceRows` triés par id (ordre d'insertion = ordre du classement live) : l'ordre est conservé tel quel.
 * `licenceId` est un nombre à l'exécution, comme dans le live (colonne int), même si le DTO le type en string.
 */
export function fromArchiveEntities(riders: ChallengeArchiveRiderEntity[]): ChallengeRiderDto[] {
  return riders.map(rider => {
    const licenceId = rider.licenceId as unknown as string;
    return {
      licenceId,
      name: rider.name,
      firstName: rider.firstName,
      gender: rider.gender,
      currentLicenceCatev: rider.catev,
      currentLicenceCatea: rider.catea,
      currentClub: rider.club,
      sprintchallenge: rider.sprintchallenge as boolean,
      ptsAllRaces: rider.ptsAllRaces,
      explanation: rider.explanation ?? undefined,
      challengeRaceRows: rider.raceRows.map(row => ({
        licenceId,
        competitionId: row.competitionId,
        competitionName: row.competitionName,
        eventDate: row.eventDate,
        catev: row.catev,
        rankingScratch: row.rankingScratch,
        nbParticipants: row.nbParticipants,
        comment: row.comment,
        sprintchallenge: row.sprintchallenge,
        ptsRace: row.ptsRace,
        explanation: row.explanation ?? undefined,
      })),
    };
  });
}
