import { EntityManager, Repository } from "typeorm";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ChallengeDTO, ChallengeRider } from "../dto/model.dto";
import { ROLES, RolesGuard } from "../guards/roles.guard";
import { ChallengeEntity } from "../entity/challenge.entity";
import { Roles } from "../decorators/roles.decorator";
import { ChallengeService } from "../services/challenge.service";
import * as _ from "lodash";
import { CompetitionType } from "../entity/competition.entity";

@Controller("/api/challenge")
@ApiTags("ChallengeAPI")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class ChallengeController {
  constructor(
    @InjectRepository(ChallengeEntity)
    private readonly repositoryChallenge: Repository<ChallengeEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @ApiOperation({
    operationId: "getAllChallenges",
    summary: "Rechercher tous les challenges",
    description: "Renvoie la liste de tous les challenges",
  })
  @ApiResponse({
    status: 200,
    type: ChallengeDTO,
    isArray: true,
    description: "Liste des challenges",
  })
  @Get("/all")
  public async getAllChallenges(): Promise<ChallengeDTO[]> {
    const challengeDTOs = await this.repositoryChallenge.find({
      where: { active: true },
    });
    return challengeDTOs.map((challengeDTO) => {
      return {
        ...challengeDTO,
      };
    });
  }

  @Get("/calcul/:id")
  @ApiOperation({
    operationId: "calculChallenge",
    summary: "Calculer les challenges ",
  })
  @ApiResponse({ status: 200, type: ChallengeRider, isArray: true })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async calculChallenge(
    @Param("id") id: number,
  ): Promise<ChallengeRider[]> {
    const challenge = await this.repositoryChallenge.findOne({ where: { id } });

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
             ${challenge.competitionType === CompetitionType.CX ? "LICENCE.CATEV_CX" : "LICENCE.CATEV"}               AS "currentLicenceCatev",
          
             LICENCE.CATEA               AS "currentLicenceCatea",
             LICENCE.CLUB                AS "currentClub",
             COMPETITION.NAME            AS "competitionName",
             ranked_race."rankedCatev"   AS "catev",
             ranked_race."nbParticipants" AS "nbParticipants",
             ranked_race.COMMENT         AS "comment",
             ranked_race.SPRINTCHALLENGE AS "sprintchallenge",
             ranked_race.COMPETITION_ID  AS "competitionId",
             ranked_race.LICENCE_ID      AS "licenceId",
             ranked_race.SPRINTCHALLENGE AS "sprintchallenge",
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
    const allGenderRows = [];
    for (const gender of ["H", "F"]) {
      const rowRaces = await this.entityManager.query(query, [
        challenge.competitionIds,
        gender,
        challenge.competitionType,
      ]);
      // Calcul des classements hommes et dames à part
      const riders: ChallengeRider[] =
        ChallengeService.transformInRiderRaces(rowRaces);
      let calculatedRows = [];
      switch (challenge.bareme) {
        case "CHALLENGE_FSGT_31":
          calculatedRows = ChallengeService.Bareme_CHALLENGE_FSGT_31(riders);
          break;
        case "BAREME_AU_POINTS":
          calculatedRows = ChallengeService.Bareme_AU_POINTS(riders);
          break;
        case "BAREME_ASSIDUITE":
          calculatedRows = ChallengeService.Bareme_CHALLENGE_ASSIDUITE(riders);
          break;
        default:
          calculatedRows = riders;
      }
      allGenderRows.push(...calculatedRows);
    }

    return _.orderBy(
      allGenderRows,
      ["currentLicenceCatev", "ptsAllRaces"],
      ["asc", "desc"],
    );
  }

  @ApiOperation({
    operationId: "getChallengeById",
    summary: "Rechercher un challenge par son id",
    description: "Renvoie un challenge par son id",
  })
  @ApiResponse({
    status: 200,
    type: ChallengeDTO,
    description: "le challenge correspondant à l'id",
  })
  @Get(":id")
  public async getChallengeById(
    @Param("id") id: number,
  ): Promise<ChallengeDTO> {
    return this.repositoryChallenge.findOne({
      where: { id },
    });
  }
}
