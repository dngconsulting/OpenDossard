import { ChallengeRaceRow, ChallengeRider } from "../dto/model.dto";
import * as _ from "lodash";
import { baremeByCateFSGT31 } from "./baremeFSGT31";
import { baremeAuPoints } from "./baremeAuPoints";
import { baremeByCateFSGT31CX } from "./baremeFSGT31CX";

export class ChallengeService {
  static transformInRiderRaces(rowRaces: ChallengeRaceRow[]) {
    const rowRacesByLicence = _.uniqBy(rowRaces, "licenceId");
    const challengeRiders: ChallengeRider[] = [
      ...rowRacesByLicence.map((rowRace) => ({
        licenceId: rowRace.licenceId,
        name: rowRace.name,
        gender: rowRace.gender,
        currentLicenceCatev: rowRace.currentLicenceCatev,
        currentClub: rowRace.currentClub,
        currentLicenceCatea: rowRace.currentLicenceCatea,
        firstName: rowRace.firstName,
        sprintchallenge: rowRace.sprintchallenge,
        challengeRaceRows: [],
      })),
    ];
    rowRacesByLicence.forEach((riderRace) => {
      const riderRaces = rowRaces.filter(
        (r) => r.licenceId === riderRace.licenceId,
      );
      // for each rider, compute ranking
      riderRaces.forEach((challengeRaceRow, index) => {
        riderRaces[index].ptsRace = 0;
      });
      const challengeRider = challengeRiders.find(
        (cr) => cr.licenceId === riderRace.licenceId,
      );
      challengeRider.challengeRaceRows = riderRaces;
      challengeRider.ptsAllRaces = 0;
    });
    return challengeRiders;
  }

  static Bareme_CHALLENGE_FSGT_31(riderChallenge: ChallengeRider[]) {
    const catesOfChallenge = baremeByCateFSGT31.map((b) => b.catev);
    // On filtre d'abord les catégories correspondants au challenge
    const riderChallengeFiltered = riderChallenge
      .filter((rc) => catesOfChallenge.includes(rc.currentLicenceCatev))
      .map((rc) => ({
        ...rc,
        challengeRaceRows: rc.challengeRaceRows.filter((r) =>
          catesOfChallenge.includes(r.catev),
        ),
      }));
    riderChallengeFiltered.forEach((rider) => {
      // for each rider, compute ranking
      rider.challengeRaceRows.forEach((riderRace, index) => {
        const bareme = baremeByCateFSGT31.find(
          (b) => b.catev === riderRace.catev,
        );
        if (bareme) {
          rider.challengeRaceRows[index].ptsRace =
            rider.challengeRaceRows[index].ptsRace +
            (bareme.ptsBareme(riderRace.rankingScratch) ?? 0) +
            bareme.ptsParticipation;
          rider.challengeRaceRows[index].explanation = `Class. ${
            bareme.ptsBareme(riderRace.rankingScratch) ?? 0
          } pts + Part. ${bareme.ptsParticipation} pts`;
        }
      });
      rider.ptsAllRaces = _.sumBy(rider.challengeRaceRows, "ptsRace");
    });
    return riderChallengeFiltered;
  }

  static Bareme_CHALLENGE_FSGT_31_CX(riderChallenge: ChallengeRider[]) {
    const catesOfChallenge = baremeByCateFSGT31CX.map((b) => b.catev);
    // On filtre d'abord les catégories correspondants au challenge
    const riderChallengeFiltered = riderChallenge
      .filter((rc) => catesOfChallenge.includes(rc.currentLicenceCatev))
      .map((rc) => ({
        ...rc,
        challengeRaceRows: rc.challengeRaceRows.filter((r) =>
          catesOfChallenge.includes(r.catev),
        ),
      }));
    riderChallengeFiltered.forEach((rider) => {
      // for each rider, compute ranking
      rider.challengeRaceRows.forEach((riderRace, index) => {
        const bareme = baremeByCateFSGT31CX.find(
          (b) => b.catev === riderRace.catev,
        );
        if (bareme) {
          rider.challengeRaceRows[index].ptsRace =
            rider.challengeRaceRows[index].ptsRace +
            (bareme.ptsBareme(riderRace.rankingScratch) ?? 0) +
            bareme.ptsParticipation;
          rider.challengeRaceRows[index].explanation = `Class. ${
            bareme.ptsBareme(riderRace.rankingScratch) ?? 0
          } pts + Part. ${bareme.ptsParticipation} pts`;
        }
      });
      rider.ptsAllRaces = _.sumBy(rider.challengeRaceRows, "ptsRace");
    });
    return riderChallengeFiltered;
  }

  static Bareme_CHALLENGE_ASSIDUITE(riderChallenge: ChallengeRider[]) {
    riderChallenge.forEach((rider) => {
      // for each rider, compute ranking
      rider.challengeRaceRows.forEach((riderRace, index) => {
        rider.challengeRaceRows[index].ptsRace =
          rider.challengeRaceRows[index].ptsRace + 1;
        rider.challengeRaceRows[index].explanation =
          `Présent et marque ${rider.challengeRaceRows[index].ptsRace} pts`;
      });
      rider.ptsAllRaces = _.sumBy(rider.challengeRaceRows, "ptsRace");
    });

    return riderChallenge;
  }

  static Bareme_AU_POINTS(riderChallenge: ChallengeRider[]) {
    let ptsAllRaces = 0;
    let nbRaces = 0;
    riderChallenge.forEach((rider) => {
      ptsAllRaces = 0;
      nbRaces = 0;
      // for each rider, compute ranking
      rider.challengeRaceRows.forEach((riderRace, index) => {
        // si le coureur a changé de catégorie on remet à zéro son total points
        nbRaces++;
        if (
          index > 0 &&
          rider.challengeRaceRows[index].catev !==
            rider.challengeRaceRows[index - 1].catev
        ) {
          ptsAllRaces = 0;
        }
        rider.challengeRaceRows[index].ptsRace =
          Math.round(
            (rider.challengeRaceRows[index].ptsRace +
              (baremeAuPoints.ptsBareme(riderRace.rankingScratch) ?? 0) *
                baremeAuPoints.coef(Number(riderRace.nbParticipants))) *
              100,
          ) / 100;
        if (riderRace.sprintchallenge) {
          rider.challengeRaceRows[index].ptsRace =
            rider.challengeRaceRows[index].ptsRace + 50;
        }
        ptsAllRaces = ptsAllRaces + rider.challengeRaceRows[index].ptsRace;
        rider.challengeRaceRows[index].explanation = `nb part. épreuve => ${
          riderRace.nbParticipants
        } et pts classement : ${(
          baremeAuPoints.ptsBareme(riderRace.rankingScratch) ?? 0
        ).toFixed(1)} ${
          riderRace.sprintchallenge ? " + 50 pts sprint/gpm" : ""
        }`;
      });
      if (
        !rider.challengeRaceRows.find(
          (r) => r.catev === rider.currentLicenceCatev,
        )
      ) {
        rider.ptsAllRaces = 0;
      } else {
        // On applique le coef d'assiduité en fonction du nb de courses
        const coef = 1 + ((nbRaces > 12 ? 12 : nbRaces) - 1) * 0.2;
        rider.ptsAllRaces = Math.round(ptsAllRaces / coef);
        rider.explanation = `Assiduité de ${coef.toFixed(
          1,
        )}, total pts ${Math.round(
          ptsAllRaces / coef,
        )} => ${ptsAllRaces.toFixed(1)}/${coef.toFixed(1)}`;
      }
    });
    return riderChallenge;
  }
}
