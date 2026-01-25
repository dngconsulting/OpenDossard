import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ChallengeEntity } from './entities/challenge.entity';
import { ChallengeRaceRowDto, ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { baremeByCateFSGT31, baremeByCateFSGT31CX, baremeAuPoints } from './baremes';
import * as _ from 'lodash';

export interface CreateChallengeDto {
  name: string;
  description?: string;
  reglement?: string;
  active?: boolean;
  competitionIds?: number[];
  bareme: string;
  competitionType: string;
}

export interface UpdateChallengeDto {
  name?: string;
  description?: string;
  reglement?: string;
  active?: boolean;
  competitionIds?: number[];
  bareme?: string;
  competitionType?: string;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(ChallengeEntity)
    private challengeRepository: Repository<ChallengeEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(active?: boolean): Promise<ChallengeEntity[]> {
    const queryBuilder = this.challengeRepository.createQueryBuilder('challenge');

    if (active !== undefined) {
      queryBuilder.where('challenge.active = :active', { active });
    }

    queryBuilder.orderBy('challenge.name', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<ChallengeEntity> {
    const challenge = await this.challengeRepository.findOne({
      where: { id },
    });
    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${id} not found`);
    }
    return challenge;
  }

  async create(challengeData: CreateChallengeDto): Promise<ChallengeEntity> {
    const challenge = this.challengeRepository.create(challengeData);
    return this.challengeRepository.save(challenge);
  }

  async update(id: number, challengeData: UpdateChallengeDto): Promise<ChallengeEntity> {
    const challenge = await this.findOne(id);
    Object.assign(challenge, challengeData);
    return this.challengeRepository.save(challenge);
  }

  async remove(id: number): Promise<void> {
    const challenge = await this.findOne(id);
    await this.challengeRepository.remove(challenge);
  }

  async addCompetition(id: number, competitionId: number): Promise<ChallengeEntity> {
    const challenge = await this.findOne(id);
    if (!challenge.competitionIds) {
      challenge.competitionIds = [];
    }
    if (!challenge.competitionIds.includes(competitionId)) {
      challenge.competitionIds.push(competitionId);
    }
    return this.challengeRepository.save(challenge);
  }

  async removeCompetition(id: number, competitionId: number): Promise<ChallengeEntity> {
    const challenge = await this.findOne(id);
    if (challenge.competitionIds) {
      challenge.competitionIds = challenge.competitionIds.filter(
        (cid) => cid !== competitionId,
      );
    }
    return this.challengeRepository.save(challenge);
  }

  async getRanking(id: number): Promise<ChallengeRiderDto[]> {
    const challenge = await this.findOne(id);

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
                                  COUNT(*) OVER (PARTITION BY competition_id,race.catev) as "nbParticipants",
                             CASE
                                    WHEN race.comment IS NOT NULL THEN NULL
                                    ELSE ROW_NUMBER()
                                         OVER (PARTITION BY competition_id,race.catev ORDER BY ranking_scratch)
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
      const rowRaces = await this.entityManager.query(query, [
        challenge.competitionIds,
        gender,
        challenge.competitionType,
      ]);

      const riders: ChallengeRiderDto[] = this.transformInRiderRaces(rowRaces);

      let calculatedRows: ChallengeRiderDto[] = [];
      switch (challenge.bareme) {
        case 'CHALLENGE_FSGT_31':
          calculatedRows = this.baremeChallengeFSGT31(riders);
          break;
        case 'CHALLENGE_FSGT_31_CX':
          calculatedRows = this.baremeChallengeFSGT31CX(riders);
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

    return _.orderBy(allGenderRows, ['currentLicenceCatev', 'ptsAllRaces'], ['asc', 'desc']);
  }

  private transformInRiderRaces(rowRaces: ChallengeRaceRowDto[]): ChallengeRiderDto[] {
    const rowRacesByLicence = _.uniqBy(rowRaces, 'licenceId');
    const challengeRiders: ChallengeRiderDto[] = [
      ...rowRacesByLicence.map((rowRace: any) => ({
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

    rowRacesByLicence.forEach((riderRace: any) => {
      const riderRaces = rowRaces.filter((r: any) => r.licenceId === riderRace.licenceId);
      riderRaces.forEach((challengeRaceRow: any, index: number) => {
        riderRaces[index].ptsRace = 0;
      });
      const challengeRider = challengeRiders.find(
        (cr) => cr.licenceId === riderRace.licenceId,
      );
      if (challengeRider) {
        challengeRider.challengeRaceRows = riderRaces as ChallengeRaceRowDto[];
        challengeRider.ptsAllRaces = 0;
      }
    });

    return challengeRiders;
  }

  private baremeChallengeFSGT31(riderChallenge: ChallengeRiderDto[]): ChallengeRiderDto[] {
    const catesOfChallenge = baremeByCateFSGT31.map((b) => b.catev);
    const riderChallengeFiltered = riderChallenge
      .filter((rc) => catesOfChallenge.includes(rc.currentLicenceCatev))
      .map((rc) => ({
        ...rc,
        challengeRaceRows: rc.challengeRaceRows.filter((r) =>
          catesOfChallenge.includes(r.catev),
        ),
      }));

    riderChallengeFiltered.forEach((rider) => {
      rider.challengeRaceRows.forEach((riderRace, index) => {
        const bareme = baremeByCateFSGT31.find((b) => b.catev === riderRace.catev);
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

  private baremeChallengeFSGT31CX(riderChallenge: ChallengeRiderDto[]): ChallengeRiderDto[] {
    const catesOfChallenge = baremeByCateFSGT31CX.map((b) => b.catev);
    const riderChallengeFiltered = riderChallenge
      .filter((rc) => catesOfChallenge.includes(rc.currentLicenceCatev))
      .map((rc) => ({
        ...rc,
        challengeRaceRows: rc.challengeRaceRows.filter((r) =>
          catesOfChallenge.includes(r.catev),
        ),
      }));

    riderChallengeFiltered.forEach((rider) => {
      rider.challengeRaceRows.forEach((riderRace, index) => {
        const bareme = baremeByCateFSGT31CX.find((b) => b.catev === riderRace.catev);
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
    riderChallenge.forEach((rider) => {
      rider.challengeRaceRows.forEach((riderRace, index) => {
        rider.challengeRaceRows[index].ptsRace =
          (rider.challengeRaceRows[index].ptsRace || 0) + 1;
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

    riderChallenge.forEach((rider) => {
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

      if (!rider.challengeRaceRows.find((r) => r.catev === rider.currentLicenceCatev)) {
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
