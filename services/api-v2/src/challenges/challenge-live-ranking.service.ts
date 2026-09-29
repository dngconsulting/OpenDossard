import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as _ from 'lodash';
import { ChallengeEntity } from './entities/challenge.entity';
import { ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { baremeByCateFSGT31, baremeByCateFSGT31CX, baremeAuPoints } from './baremes';
import { RankedChallengeRider, rankRiders } from './challenge-ranking.utils';

/** Ligne brute renvoyée par la requête du classement live : un résultat d'un coureur à une épreuve. */
interface RawChallengeRaceRow {
  name: string;
  firstName: string;
  gender: string;
  currentLicenceCatev: string;
  currentLicenceCatea: string;
  currentClub: string;
  competitionName: string;
  catev: string;
  nbParticipants: number;
  comment?: string;
  sprintchallenge?: boolean;
  competitionId: number;
  licenceId: string;
  rankingScratch: number;
  eventDate: Date;
}

@Injectable()
export class ChallengeLiveRankingService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /** Classement calculé en direct (catégories et clubs actuels des licences), rang inclus. */
  async compute(
    challenge: ChallengeEntity,
    manager: EntityManager = this.entityManager,
  ): Promise<RankedChallengeRider[]> {
    if (!challenge.competitionIds || challenge.competitionIds.length === 0) {
      return [];
    }

    const catevColumn = challenge.competitionType === 'CX' ? 'LICENCE.CATEV_CX' : 'LICENCE.CATEV';

    const query = `
      WITH ranked_race AS (SELECT competition_id,
                                  race.catev as "rankedCatev",
                                  licence_id,
                                  ranking_scratch,
                                  race.comment,
                                  sprintchallenge,
                                  COUNT(*) OVER (PARTITION BY competition_id,race.catev)::int as "nbParticipants",
                             CASE
                                    WHEN race.comment IS NOT NULL THEN NULL
                                    ELSE ROW_NUMBER()
                                         OVER (PARTITION BY competition_id,race.catev ORDER BY ranking_scratch)::int
                                    END      AS "rankingScratch"
                           FROM race
                                  join LICENCE ON LICENCE.ID = licence_id
                                  JOIN COMPETITION ON COMPETITION.ID = competition_id
                           where LICENCE.GENDER = $2
                             AND COMPETITION.fede = 'FSGT' AND (ranking_scratch is not null OR race.comment is not null))
      SELECT LICENCE.NAME                AS "name",
             LICENCE.FIRST_NAME          AS "firstName",
             LICENCE.GENDER              AS "gender",
             ${catevColumn}               AS "currentLicenceCatev",

             LICENCE.CATEA               AS "currentLicenceCatea",
             LICENCE.CLUB                AS "currentClub",
             COMPETITION.NAME            AS "competitionName",
             ranked_race."rankedCatev"   AS "catev",
             ranked_race."nbParticipants" AS "nbParticipants",
             ranked_race.COMMENT         AS "comment",
             ranked_race.SPRINTCHALLENGE AS "sprintchallenge",
             ranked_race.COMPETITION_ID  AS "competitionId",
             ranked_race.LICENCE_ID      AS "licenceId",
             ranked_race."rankingScratch",
             COMPETITION.EVENT_DATE      AS "eventDate"

      FROM ranked_race
             JOIN COMPETITION ON COMPETITION.ID = ranked_race.COMPETITION_ID
             JOIN LICENCE ON LICENCE.ID = ranked_race.LICENCE_ID
      WHERE COMPETITION_ID  = ANY($1)
        AND LICENCE.GENDER = $2
        AND COMPETITION_TYPE = $3
        AND LICENCE.FEDE = 'FSGT'
      ORDER BY ranked_race.LICENCE_ID,
               COMPETITION.EVENT_DATE,
               "currentLicenceCatev" `;

    const allGenderRows: ChallengeRiderDto[] = [];

    for (const gender of ['H', 'F']) {
      const rowRaces: RawChallengeRaceRow[] = await manager.query(query, [
        challenge.competitionIds,
        gender,
        challenge.competitionType,
      ]);

      const riders: ChallengeRiderDto[] = this.transformInRiderRaces(rowRaces);

      let calculatedRows: ChallengeRiderDto[] = [];
      switch (challenge.bareme) {
        case 'CHALLENGE_FSGT_31':
          calculatedRows = this.applyBaremeByCategory(riders, baremeByCateFSGT31);
          break;
        case 'CHALLENGE_FSGT_31_CX':
          calculatedRows = this.applyBaremeByCategory(riders, baremeByCateFSGT31CX);
          break;
        case 'BAREME_AU_POINTS':
          calculatedRows = this.baremeAuPoints(riders);
          break;
        case 'BAREME_ASSIDUITE':
          calculatedRows = this.baremeAssiduite(riders);
          break;
        default:
          calculatedRows = riders;
      }
      allGenderRows.push(...calculatedRows);
    }

    return rankRiders(allGenderRows);
  }

  private transformInRiderRaces(rowRaces: RawChallengeRaceRow[]): ChallengeRiderDto[] {
    const rowRacesByLicence = _.uniqBy(rowRaces, 'licenceId');
    const challengeRiders: ChallengeRiderDto[] = [
      ...rowRacesByLicence.map(rowRace => ({
        licenceId: rowRace.licenceId,
        name: rowRace.name,
        gender: rowRace.gender,
        currentLicenceCatev: rowRace.currentLicenceCatev,
        currentClub: rowRace.currentClub,
        currentLicenceCatea: rowRace.currentLicenceCatea,
        firstName: rowRace.firstName,
        sprintchallenge: rowRace.sprintchallenge,
        challengeRaceRows: [],
        ptsAllRaces: 0,
      })),
    ];

    rowRacesByLicence.forEach(riderRace => {
      const riderRaces = rowRaces.filter(r => r.licenceId === riderRace.licenceId);
      const challengeRider = challengeRiders.find(cr => cr.licenceId === riderRace.licenceId);
      if (challengeRider) {
        // Projection sur les champs du DTO : pas de fuite des colonnes coureur du SELECT brut.
        challengeRider.challengeRaceRows = riderRaces.map(r => ({
          licenceId: r.licenceId,
          competitionId: r.competitionId,
          competitionName: r.competitionName,
          eventDate: r.eventDate,
          catev: r.catev,
          rankingScratch: r.rankingScratch,
          nbParticipants: r.nbParticipants,
          comment: r.comment,
          sprintchallenge: r.sprintchallenge,
          ptsRace: 0,
        }));
        challengeRider.ptsAllRaces = 0;
      }
    });

    return challengeRiders;
  }

  private applyBaremeByCategory(
    riderChallenge: ChallengeRiderDto[],
    baremeData: typeof baremeByCateFSGT31,
  ): ChallengeRiderDto[] {
    const catesOfChallenge = baremeData.map(b => b.catev);
    const riderChallengeFiltered = riderChallenge
      .filter(rc => catesOfChallenge.includes(rc.currentLicenceCatev))
      .map(rc => ({
        ...rc,
        challengeRaceRows: rc.challengeRaceRows.filter(r => catesOfChallenge.includes(r.catev)),
      }));

    riderChallengeFiltered.forEach(rider => {
      rider.challengeRaceRows.forEach((riderRace, index) => {
        const bareme = baremeData.find(b => b.catev === riderRace.catev);
        if (bareme) {
          rider.challengeRaceRows[index].ptsRace =
            (rider.challengeRaceRows[index].ptsRace || 0) +
            (bareme.ptsBareme(riderRace.rankingScratch) ?? 0) +
            bareme.ptsParticipation;
          rider.challengeRaceRows[index].explanation = `Class. ${
            bareme.ptsBareme(riderRace.rankingScratch) ?? 0
          } pts + Part. ${bareme.ptsParticipation} pts`;
        }
      });
      rider.ptsAllRaces = _.sumBy(rider.challengeRaceRows, 'ptsRace');
    });

    return riderChallengeFiltered;
  }

  private baremeAssiduite(riderChallenge: ChallengeRiderDto[]): ChallengeRiderDto[] {
    riderChallenge.forEach(rider => {
      rider.challengeRaceRows.forEach((riderRace, index) => {
        rider.challengeRaceRows[index].ptsRace = (rider.challengeRaceRows[index].ptsRace || 0) + 1;
        rider.challengeRaceRows[index].explanation =
          `Présent et marque ${rider.challengeRaceRows[index].ptsRace} pts`;
      });
      rider.ptsAllRaces = _.sumBy(rider.challengeRaceRows, 'ptsRace');
    });

    return riderChallenge;
  }

  private baremeAuPoints(riderChallenge: ChallengeRiderDto[]): ChallengeRiderDto[] {
    let ptsAllRaces = 0;
    let nbRaces = 0;

    riderChallenge.forEach(rider => {
      ptsAllRaces = 0;
      nbRaces = 0;

      rider.challengeRaceRows.forEach((riderRace, index) => {
        nbRaces++;
        if (
          index > 0 &&
          rider.challengeRaceRows[index].catev !== rider.challengeRaceRows[index - 1].catev
        ) {
          ptsAllRaces = 0;
        }

        rider.challengeRaceRows[index].ptsRace =
          Math.round(
            ((rider.challengeRaceRows[index].ptsRace || 0) +
              (baremeAuPoints.ptsBareme(riderRace.rankingScratch) ?? 0) *
                baremeAuPoints.coef(Number(riderRace.nbParticipants))) *
              100,
          ) / 100;

        if (riderRace.sprintchallenge) {
          rider.challengeRaceRows[index].ptsRace =
            (rider.challengeRaceRows[index].ptsRace || 0) + 50;
        }

        ptsAllRaces = ptsAllRaces + (rider.challengeRaceRows[index].ptsRace || 0);
        rider.challengeRaceRows[index].explanation = `nb part. épreuve => ${
          riderRace.nbParticipants
        } et pts classement : ${(baremeAuPoints.ptsBareme(riderRace.rankingScratch) ?? 0).toFixed(
          1,
        )} ${riderRace.sprintchallenge ? ' + 50 pts sprint/gpm' : ''}`;
      });

      if (!rider.challengeRaceRows.find(r => r.catev === rider.currentLicenceCatev)) {
        rider.ptsAllRaces = 0;
      } else {
        const coef = 1 + ((nbRaces > 12 ? 12 : nbRaces) - 1) * 0.2;
        rider.ptsAllRaces = Math.round(ptsAllRaces / coef);
        rider.explanation = `Assiduité de ${coef.toFixed(1)}, total pts ${Math.round(
          ptsAllRaces / coef,
        )} => ${ptsAllRaces.toFixed(1)}/${coef.toFixed(1)}`;
      }
    });

    return riderChallenge;
  }
}
