import { ChallengeRaceRow, ChallengeRider } from "../dto/model.dto";
import * as _ from "lodash";
import { baremeByCateFSGT31 } from "./baremeFSGT31";

export class ChallengeService {
  static CalculChallengeFSGT31(rowRaces: ChallengeRaceRow[]) {
    const rowRacesByLicence = _.uniqBy(rowRaces, "licenceId");
    const challengeRiders: ChallengeRider[] = [
      ...rowRacesByLicence.map(rowRace => ({
        licenceId: rowRace.licenceId,
        name: rowRace.name,
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
        const bareme = baremeByCateFSGT31.find(
          b => b.catev === riderRace.catev
        );
        if (bareme) {
          riderRaces[index].ptsRace = riderRaces[index].ptsRace =
            (bareme.ptsBareme(riderRace.rankingScratch) ?? 0) +
            bareme.ptsParticipation;
        }
      });
      const challengeRider = challengeRiders.find(
        cr => cr.licenceId === riderRace.licenceId
      );
      challengeRider.challengeRaceRows = riderRaces;
      challengeRider.ptsAllRaces = _.sumBy(riderRaces, "ptsRace");
    });

    return challengeRiders;
  }
}
