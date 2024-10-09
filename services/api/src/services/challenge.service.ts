import { ChallengeRaceRow, ChallengeRider } from "../dto/model.dto";
import * as _ from "lodash";
import { baremeByCateFSGT31 } from "./baremeFSGT31";
import { baremeAuPoints } from "./baremeAuPoints";

export class ChallengeService {
  static transformInRiderRaces(rowRaces: ChallengeRaceRow[]) {
    const rowRacesByLicence = _.uniqBy(rowRaces, "licenceId");
    const challengeRiders: ChallengeRider[] = [
      ...rowRacesByLicence.map(rowRace => ({
        licenceId: rowRace.licenceId,
        name: rowRace.name,
        gender: rowRace.gender,
        currentLicenceCatev: rowRace.currentLicenceCatev,
        currentClub: rowRace.currentClub,
        currentLicenceCatea: rowRace.currentLicenceCatea,
        firstName: rowRace.firstName,
        challengeRaceRows: []
      }))
    ];
    rowRacesByLicence.forEach(riderRace => {
      const riderRaces = rowRaces.filter(
        r => r.licenceId === riderRace.licenceId
      );
      // for each rider, compute ranking
      riderRaces.forEach((riderRace, index) => {
        riderRaces[index].ptsRace = 0;
      });
      const challengeRider = challengeRiders.find(
        cr => cr.licenceId === riderRace.licenceId
      );
      challengeRider.challengeRaceRows = riderRaces;
      challengeRider.ptsAllRaces = 0;
    });
    return challengeRiders;
  }

  static Bareme_CHALLENGE_FSGT_31(riderChallenge: ChallengeRider[]) {
    riderChallenge.forEach(rider => {
      // for each rider, compute ranking
      rider.challengeRaceRows.forEach((riderRace, index) => {
        const bareme = baremeByCateFSGT31.find(
          b => b.catev === riderRace.catev
        );
        if (bareme) {
          rider.challengeRaceRows[index].ptsRace =
            rider.challengeRaceRows[index].ptsRace +
            (bareme.ptsBareme(riderRace.rankingScratch) ?? 0) +
            bareme.ptsParticipation;
        }
      });
      rider.ptsAllRaces = _.sumBy(rider.challengeRaceRows, "ptsRace");
    });

    return riderChallenge;
  }

  static Bareme_CHALLENGE_ASSIDUITE(riderChallenge: ChallengeRider[]) {
    riderChallenge.forEach(rider => {
      // for each rider, compute ranking
      rider.challengeRaceRows.forEach((riderRace, index) => {
        rider.challengeRaceRows[index].ptsRace =
          rider.challengeRaceRows[index].ptsRace + 1;
      });
      rider.ptsAllRaces = _.sumBy(rider.challengeRaceRows, "ptsRace");
    });

    return riderChallenge;
  }

  static Bareme_AU_POINTS(riderChallenge: ChallengeRider[]) {
    let ptsAllRaces = 0;
    riderChallenge.forEach(rider => {
      ptsAllRaces = 0;
      // for each rider, compute ranking
      rider.challengeRaceRows.forEach((riderRace, index) => {
        // si le coureur a changé de catégorie on remet à zéro son total points

        if (
          index > 0 &&
          rider.challengeRaceRows[index].catev !=
            rider.challengeRaceRows[index - 1].catev
        )
          ptsAllRaces = 0;
        rider.challengeRaceRows[index].ptsRace =
          Math.round(
            (rider.challengeRaceRows[index].ptsRace +
              (baremeAuPoints.ptsBareme(riderRace.rankingScratch) ?? 0) *
                baremeAuPoints.coef(riderRace.nbParticipants)) *
              100
          ) / 100;
        ptsAllRaces = ptsAllRaces + rider.challengeRaceRows[index].ptsRace;
      });
      if (
        !rider.challengeRaceRows.find(
          r => r.catev === rider.currentLicenceCatev
        )
      )
        rider.ptsAllRaces = 0;
      else rider.ptsAllRaces = Math.round(ptsAllRaces);
    });
    return riderChallenge;
  }
}
