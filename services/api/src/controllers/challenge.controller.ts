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

@Controller("/api/challenge")
@ApiTags("ChallengeAPI")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class ChallengeController {
  constructor(
    @InjectRepository(ChallengeEntity)
    private readonly repositoryChallenge: Repository<ChallengeEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager
  ) {}

  @ApiOperation({
    operationId: "getAllChallenges",
    summary: "Rechercher tous les challenges",
    description: "Renvoie la liste de tous les challenges"
  })
  @ApiResponse({
    status: 200,
    type: ChallengeDTO,
    isArray: true,
    description: "Liste des challenges"
  })
  @Get("/all")
  public async getAllChallenges(): Promise<ChallengeDTO[]> {
    const challengeDTOs = await this.repositoryChallenge.find({
      where: { active: true }
    });
    return challengeDTOs.map(challengeDTO => {
      return {
        ...challengeDTO
      };
    });
  }

  @Get("/calcul/:id")
  @ApiOperation({
    operationId: "calculChallenge",
    summary: "Calculer les challenges "
  })
  @ApiResponse({ status: 200, type: ChallengeRider, isArray: true })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async calculChallenge(
    @Param("id") id: number
  ): Promise<ChallengeRider[]> {
    const challenge = await this.repositoryChallenge.findOne(id);
    const nbParticipants =
      challenge.bareme === "BAREME_AU_POINTS"
        ? `(SELECT COUNT(*) FROM RACE RR                   JOIN LICENCE LL ON RR.LICENCE_ID = LL.ID
              WHERE RR.COMPETITION_ID = R.COMPETITION_ID
                AND RR.CATEV = R.CATEV
                AND LL.gender = $2) AS "nbParticipants",`
        : "";

    const query = `
      SELECT 
             LICENCE.NAME as "name",
             LICENCE.first_name as "firstName",
             LICENCE.gender as "gender",
             LICENCE.catev as "currentLicenceCatev",
             LICENCE.catea as "currentLicenceCatea",
             LICENCE.club as "currentClub",
             COMPETITION.NAME as "competitionName",
             ${nbParticipants}
             NULLIF(
                 (SELECT COUNT(*)
                  FROM RACE RR
                         JOIN LICENCE LL ON RR.LICENCE_ID = LL.ID
                  WHERE RR.COMPETITION_ID = R.COMPETITION_ID
                    AND RR.CATEV = R.CATEV
                    AND LL.gender = $2
                    AND RR.RANKING_SCRATCH <= R.RANKING_SCRATCH), 0) AS "rankingScratch",
             R.catev as "catev",
             R.comment as "comment",
             R.sprintchallenge as "sprintchallenge",
             R.competition_id as "competitionId",
             R.licence_id as "licenceId",
             R.sprintchallenge as "sprintchallenge",
             COMPETITION.event_date as "eventDate"
             
      FROM PUBLIC.RACE R
             JOIN COMPETITION ON COMPETITION.ID = R.COMPETITION_ID
             JOIN LICENCE ON LICENCE.ID = R.LICENCE_ID
      WHERE COMPETITION_ID = ANY($1) AND LICENCE.GENDER = $2 AND COMPETITION_TYPE=$3  AND LICENCE.FEDE = 'FSGT'
      ORDER BY R.LICENCE_ID,
               COMPETITION.EVENT_DATE, "currentLicenceCatev"`;
    let allGenderRows = [];
    for (const gender of ["H", "F"]) {
      const rowRaces = await this.entityManager.query(query, [
        challenge.competitionIds,
        gender,
        challenge.competitionType
      ]);
      // Calcul des classements hommes et dames à part
      const riders: ChallengeRider[] = ChallengeService.transformInRiderRaces(
        rowRaces
      );
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
      ["asc", "desc"]
    );
  }

  @ApiOperation({
    operationId: "getChallengeById",
    summary: "Rechercher un challenge par son id",
    description: "Renvoie un challenge par son id"
  })
  @ApiResponse({
    status: 200,
    type: ChallengeDTO,
    description: "le challenge correspondant à l'id"
  })
  @Get(":id")
  public async getChallengeById(
    @Param("id") id: number
  ): Promise<ChallengeDTO> {
    return this.repositoryChallenge.findOne({
      where: { id }
    });
  }
}
