import { EntityManager } from "typeorm";

import { RaceEntity } from "../entity/race.entity";
import { LicenceEntity } from "../entity/licence.entity";
import {
  CompetitionEntity,
  CompetitionType
} from "../entity/competition.entity";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import * as _ from "lodash";
import { AuthGuard } from "@nestjs/passport";
import {
  CompetitionFilter,
  RaceCreate,
  RaceNbRider,
  RaceRow,
  UpdateToursParams
} from "../dto/model.dto";
import { ROLES, RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { CompetitionService } from "../services/competition.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { Readable } from "stream";

const csv = require("csv-parser");

/***
 * Races Controller manages races inside Competitions
 * Races a generally organized by category
 */
@Controller("/api/races")
@ApiTags("RaceAPI")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class RacesCtrl {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly competitionService: CompetitionService
  ) {}

  @Get("/nbRider")
  @ApiOperation({
    operationId: "getNumberRider",
    summary: "Rechercher le nombre de coureur par course "
  })
  @ApiResponse({ status: 200, type: RaceNbRider, isArray: true })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async getNumberRider(): Promise<RaceNbRider[]> {
    return null;
  }

  @UseInterceptors(FileInterceptor("file"))
  @Post("results/upload/:id")
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param("id") id
  ): Promise<string> {
    const results = Array<{
      Dossard: string;
      Chrono: string;
      Tours: number;
      Classement: string;
    }>();
    let message = "<br>------------ Résultats du traitement ----------------";

    const asyncGetRaceRows = results => {
      return Promise.all(
        results.map(async (result, index) => {
          // Récupération du dossard à partir du competitionId
          return {
            raceRow: await this.entityManager.findOne(RaceEntity, {
              where: {
                riderNumber: result.Dossard,
                competition: id
              }
            }),
            result: result
          };
        })
      );
    };

    const asyncSaveRows = async resultRaceRows => {
      return Promise.all(
        resultRaceRows.map(resultRaceRow => {
          message +=
            "<br>Sauvegarde Dossard " +
            (resultRaceRow.result?.Dossard ?? "NC") +
            " chrono=" +
            (resultRaceRow.result?.Chrono ?? "NC") +
            " class.=" +
            (resultRaceRow.result?.Classement ?? "NC") +
            " tours=" +
            (resultRaceRow.result?.Tours ?? "NC");
          if (resultRaceRow.raceRow) {
            let canSave = true;
            resultRaceRow.raceRow.chrono = resultRaceRow.result.Chrono;
            if (Number.isNaN(parseInt(resultRaceRow.result.Tours))) {
              resultRaceRow.raceRow.tours = undefined;
              resultRaceRow.result.Tours = undefined;
            } else {
              resultRaceRow.raceRow.tours = resultRaceRow.result.Tours;
            }
            if (isNaN(parseInt(resultRaceRow.result.Classement))) {
              if (
                ["ABD", "DSQ", "ABD", "NC", "NP", "CHT"].includes(
                  resultRaceRow.result.Classement
                )
              )
                resultRaceRow.raceRow.comment = resultRaceRow.result.Classement;
              else canSave = false;
            } else
              resultRaceRow.raceRow.rankingScratch = parseInt(
                resultRaceRow.result.Classement
              );

            if (canSave) {
              const r = this.entityManager.save(resultRaceRow.raceRow);
              message += " OK";
              return r;
            } else {
              message += "<span style='color:red'> NOK</span>";
            }
          } else {
            message += "<span style='color:red'> Non trouvé !</span>";
          }
        })
      );
    };

    return new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(csv({ separator: ";" }))
        .on("data", data => {
          results.push(data);
        })
        .on("end", async () => {
          try {
            // Check de la consécutivité des classements avant de faire quoique ce soit
            results.forEach((result, index) => {
              if (
                !isNaN(parseInt(result.Classement)) &&
                parseInt(result.Classement) != index + 1
              )
                throw new BadRequestException(
                  "Le classement du Dossard " +
                    result.Dossard +
                    " n'est pas consécutif ! classement=>" +
                    parseInt(result.Classement) +
                    " doit être " +
                    (index + 1)
                );
            });
            const raceRows = await asyncGetRaceRows(results);
            await asyncSaveRows(raceRows);
            message +=
              "<br>Enregistrement terminée, " +
              results.length +
              " lignes traitées";
            message +=
              "<br>--------------------- Fin du traitement ----------------------";
            resolve(message);
          } catch (err) {
            reject(new BadRequestException(err.message));
          }
        });
    });
  }

  @Post("/getRaces")
  @ApiOperation({
    operationId: "getRaces",
    summary:
      "Rechercher les participations aux courses de MM/JJ/AAAA à MM/JJ/AAAA"
  })
  @ApiResponse({ status: 200, type: RaceRow, isArray: true })
  @Roles(ROLES.MOBILE, ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async getRaces(@Body() filter: CompetitionFilter): Promise<RaceRow[]> {
    const competitions = await this.competitionService.findCompetitionByFilter(
      filter
    );

    const query = `select r.id,
                              r.race_code as "raceCode",
                              r.catev,
                              r.chrono,
                              r.rider_dossard as "riderNumber",
                              r.ranking_scratch as "rankingScratch",
                              r.number_min as "numberMin",
                              r.number_max as "numberMax",
                              r.licence_id as "licenceId",
                              r.sprintchallenge,
                              r.comment,
                              r.competition_id as "competitionId",
                              concat(l.name, ' ', l.first_name) as "riderName",
                              l.licence_number,
                              r.club,
                              l.gender,
                              l.dept as "dept",
                              l.fede,
                              l.birth_year,
                              r.catea,
                              c.name,
                              c.event_date
                       from race r
                                join licence l on r.licence_id = l.id
                                join competition c on r.competition_id = c.id
                   where r.competition_id = ANY($1) `;
    return await this.entityManager.query(query, [
      competitions.map(competition => competition.id)
    ]);
  }

  @Get("palmares/:id")
  @ApiOperation({
    operationId: "getPalmares",
    summary: "Rechercher le palmares d'un coureur par son id coureur"
  })
  @ApiResponse({ status: 200, type: RaceRow, isArray: true })
  public async getPalmares(@Param("id") licenceId: number): Promise<RaceRow[]> {
    const query = `SELECT R.ID,
                          R.RACE_CODE                                                AS "raceCode",
                          R.CATEV,
                          R.CHRONO,
                          R.RIDER_DOSSARD                                            AS "riderNumber",
                          NULLIF((SELECT COUNT(*)
                                  FROM RACE RR
                                         JOIN LICENCE LL ON RR.LICENCE_ID = LL.ID
                                  WHERE RR.COMPETITION_ID = R.COMPETITION_ID
                                    AND RR.CATEV = R.CATEV
                                    AND RR.RANKING_SCRATCH <= R.RANKING_SCRATCH), 0) as "rankingScratch",
                          R.NUMBER_MIN                                               AS "numberMin",
                          R.NUMBER_MAX                                               AS "numberMax",
                          R.LICENCE_ID                                               AS "licenceId",
                          R.SPRINTCHALLENGE,
                          R.COMMENT,
                          R.COMPETITION_ID                                           AS "competitionId",
                          CONCAT(L.NAME,
                                 ' ',
                                 L.FIRST_NAME)                                       AS "riderName",
                          C.NAME,
                          C.EVENT_DATE                                               AS "competitionDate",
                          C.COMPETITION_TYPE                                         AS "competitionType",
                          C.RACES                                                    AS "competitionRaces",
                          L.LICENCE_NUMBER                                           AS "licenceNumber",
                          R.CLUB,
                          L.GENDER,
                          C.FEDE,
                          L.BIRTH_YEAR                                               AS "birthYear",
                          R.CATEA
                   FROM RACE R
                          JOIN LICENCE L ON R.LICENCE_ID = L.ID
                          JOIN COMPETITION C ON R.COMPETITION_ID = C.ID
                   WHERE R.LICENCE_ID = $1
                     AND (R.COMMENT is NULL OR R.COMMENT <> 'NC')
                   ORDER BY R.ID DESC`;
    return await this.entityManager.query(query, [licenceId]);
  }

  @Get("withpalmares/:query")
  @ApiOperation({
    operationId: "getLicencesWithPalmares",
    summary:
      "Rechercher le palmares d'un coureur qui a fait au moins une course"
  })
  @ApiResponse({ status: 200, type: LicenceEntity, isArray: true })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN, ROLES.MOBILE)
  public async getLicencesWithPalmares(
    @Param("query") query: string
  ): Promise<LicenceEntity[]> {
    const filterParam =
      "%" +
      query
        .replace(/\s+/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") +
      "%";
    const q: string = `select distinct l.licence_number ,
                                       l.id,
                                       l.club,
                                       l.gender,
                                       l.name,
                                       l.dept,
                                       l.fede,
                                       l.first_name as "firstName",
                                       l.birth_year as "birthYear",
                                       l.saison,
                                       l.catea from licence l join race r on r.licence_id=l.id
                       where REPLACE(CONCAT(UPPER(l.name),UPPER(unaccent(l.first_name))),' ','') like $1 or REPLACE(CONCAT(UPPER(unaccent(l.first_name)),UPPER(l.name)),' ','') like $1
                       order by l.name  fetch first 30 rows only`;
    return await this.entityManager.query(q, [filterParam]);
  }

  @Get("/:id")
  @ApiOperation({
    operationId: "getCompetitionRaces",
    summary: "Rechercher tous les coureurs participants à une course "
  })
  @ApiResponse({ status: 200, type: RaceRow, isArray: true })
  @Roles(ROLES.MOBILE, ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async getCompetitionRaces(
    @Param("id") competitionId: number
  ): Promise<RaceRow[]> {
    const query = `select r.id,
                              r.race_code as "raceCode",
                              r.catev,
                              r.chrono,
                              r.tours,
                              r.rider_dossard as "riderNumber",
                              r.ranking_scratch as "rankingScratch",
                              r.number_min as "numberMin",
                              r.number_max as "numberMax",
                              r.licence_id as "licenceId",
                              r.sprintchallenge,
                              r.comment,
                              r.competition_id as "competitionId",
                              concat(l.name, ' ', l.first_name) as name,
                              l.licence_number as "licenceNumber",
                              r.catea,
                              l.dept,
                              r.club,
                              l.gender,
                              l.fede,
                              l.birth_year as "birthYear"
                       from race r
                                join licence l on r.licence_id = l.id
                       where r.competition_id = $1
                       order by r.id desc`;
    return await this.entityManager.query(query, [competitionId]);
  }

  @Post()
  @ApiOperation({
    operationId: "engage",
    summary: "Engage un nouveau coureur "
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async create(@Body() race: RaceCreate): Promise<void> {
    if (!race.licenceId) {
      throw new BadRequestException("Veuillez renseigner un coureur");
    }

    if (!race.riderNumber) {
      throw new BadRequestException("Veuillez renseigner un numéro de dossard");
    }

    if (!race.catev) {
      throw new BadRequestException(
        "Veuillez renseigner la catégorie dans laquelle le coureur participe"
      );
    }

    const licence = await this.entityManager.findOne(
      LicenceEntity,
      race.licenceId
    );

    if (!licence) {
      throw new BadRequestException("Licence inconnue");
    }

    const numberConflict = await this.entityManager
      .createQueryBuilder(RaceEntity, "race")
      .where(
        "race.competition_id = :cid and race.rider_dossard = :riderNumber and race.race_code= :raceCode",
        {
          cid: race.competitionId,
          riderNumber: race.riderNumber,
          raceCode: race.raceCode
        }
      )
      .getOne();

    if (numberConflict) {
      throw new BadRequestException(
        `Le numéro de dossard ${race.riderNumber} est déjà pris`
      );
    }

    const licenceConflict = await this.entityManager
      .createQueryBuilder(RaceEntity, "race")
      .where(
        "race.competition_id = :cid and race.licence_id = :licenceId and race.race_code= :raceCode",
        {
          cid: race.competitionId,
          licenceId: licence.id,
          raceCode: race.raceCode
        }
      )
      .getOne();

    if (licenceConflict) {
      throw new BadRequestException(
        `Ce licencié est déjà inscrit sur cette épreuve`
      );
    }

    const competition = await this.entityManager.findOne(
      CompetitionEntity,
      race.competitionId
    );

    const newRace = new RaceEntity();
    newRace.raceCode = race.raceCode;
    newRace.riderNumber = race.riderNumber;
    newRace.licence = licence;
    newRace.competition = competition;
    newRace.catev = race.catev;
    newRace.catea = race.catea;
    newRace.club = race.club;
    if (race.rankingScratch) {
      newRace.rankingScratch = race.rankingScratch;
    }

    await this.entityManager.save(newRace);
  }

  @Post("/refreshEngagement/:licenceId/:competitionId")
  @ApiOperation({
    operationId: "refreshEngagement",
    summary:
      "Met à jour l'engagement du coureur licenceId sur la competition competitionId"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async refreshEngagement(
    @Param("competitionId") competitionId: number,
    @Param("licenceId") licenceId: number
  ): Promise<void> {
    Logger.debug(
      "[RefreshEngagement] licenceId =" +
        licenceId +
        " competitionId=" +
        competitionId
    );
    const licence = await this.entityManager.findOne<LicenceEntity>(
      LicenceEntity,
      {
        id: licenceId
      }
    );
    const racerowToUpdate = await this.entityManager.findOne<RaceEntity>(
      RaceEntity,
      {
        where: {
          competition: { id: competitionId },
          licence: { id: licenceId }
        },
        relations: ["competition"]
      }
    );
    racerowToUpdate.club = licence.club;
    racerowToUpdate.catea = licence.catea;
    racerowToUpdate.catev =
      racerowToUpdate.competition.competitionType === CompetitionType.CX
        ? licence.catevCX
        : licence.catev;
    await this.entityManager.save(racerowToUpdate);
  }

  @Put("/flagChallenge")
  @ApiOperation({
    summary: "Classe le vainqueur du challenge",
    operationId: "flagChallenge"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async flagChallenge(@Body() raceRow: RaceRow): Promise<void> {
    const racerowToUpdate = await this.entityManager.findOne<RaceEntity>(
      RaceEntity,
      {
        id: raceRow.id
      }
    );
    racerowToUpdate.sprintchallenge = !racerowToUpdate.sprintchallenge;
    await this.entityManager.save(racerowToUpdate);
  }

  @Put("/reorderRank")
  @ApiOperation({
    summary: "Réordonne le classement",
    operationId: "reorderRanking"
  })
  @ApiBody({ type: [RaceRow] })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async reorderRanking(@Body() racesrows: RaceRow[]): Promise<void> {
    // Lets remove non ranked riders and DSQ/ABD
    Logger.debug("Reorder ranking");
    const rows = _.remove(racesrows, item => item.id && !item.comment);
    for (let index = 1; index <= rows.length; index++) {
      const item = rows[index - 1];
      // TODO Warning n+1 Select here
      const raceRowToSave: RaceEntity = await this.entityManager.findOne(
        RaceEntity,
        { id: item.id }
      );
      if (raceRowToSave.rankingScratch !== index && !raceRowToSave.comment) {
        raceRowToSave.rankingScratch = index;
        Logger.debug(
          "Update Ranking of rider number " +
            raceRowToSave.riderNumber +
            " with rank " +
            index
        );
        await this.entityManager.save(raceRowToSave);
      }
    }
  }

  @Put("/removeRanking")
  @ApiOperation({
    summary: "Supprime un coureur du classement",
    operationId: "removeRanking"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async removeRanking(@Body() raceRow: RaceRow): Promise<void> {
    Logger.debug("RemoveRanking with raceRow=" + JSON.stringify(raceRow));
    const racerowToUpdate = await this.entityManager.findOne<RaceEntity>(
      RaceEntity,
      {
        id: raceRow.id
      }
    );
    if (!racerowToUpdate) {
      return;
    }
    // If he is ABD/DSQ, remove the comment, otherwise remove the rank
    if (racerowToUpdate.comment) {
      racerowToUpdate.comment = null;
    } else {
      Logger.debug(
        "Remove Ranking for rider number " + racerowToUpdate.riderNumber
      );
      racerowToUpdate.rankingScratch = null;
    }
    racerowToUpdate.chrono = null;
    await this.entityManager.save(racerowToUpdate);

    // Retrieve all ranks for this race ...
    const races = await this.entityManager.find(RaceEntity, {
      raceCode: raceRow.raceCode,
      competition: { id: raceRow.competitionId }
    });
    const existingRankedRaces = _.orderBy(races, ["rankingScratch"], ["asc"]);
    // ... And  reorder them because of potential "holes" after deleting
    for (let index = 1; index <= existingRankedRaces.length; index++) {
      const item = existingRankedRaces[index - 1];
      if (
        item.rankingScratch &&
        item.rankingScratch !== index &&
        !item.comment
      ) {
        item.rankingScratch = index;
        Logger.debug(
          "Update Ranking of rider number " +
            item.riderNumber +
            " with rank " +
            index
        );
        await this.entityManager.save(item);
      }
    }
  }

  @Post("/chrono/:raceId/:chrono")
  @ApiOperation({
    operationId: "updateChrono",
    summary: "Met à jour le chrono d'un coureur"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async updateChrono(
    @Param("raceId") raceId: number,
    @Param("chrono") chrono: string
  ): Promise<void> {
    const r = await this.entityManager.findOne<RaceEntity>(RaceEntity, {
      id: raceId
    });
    r.chrono = chrono;
    await this.entityManager.save(r);
  }

  @Post("/tours")
  @ApiOperation({
    operationId: "updateTours",
    summary: "Met à jour le nombre de tours d'un coureur"
  })
  public async updateTours(@Body() body: UpdateToursParams): Promise<void> {
    const r = await this.entityManager.findOne<RaceEntity>(RaceEntity, {
      id: body.raceId
    });
    r.tours = body.tours ? body.tours : null;
    await this.entityManager.save(r);
  }

  @Put("/update")
  @ApiOperation({
    summary: "Met à jour le classement du coureur ",
    operationId: "updateRanking"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async updateRanking(@Body() raceRow: RaceRow): Promise<void> {
    Logger.debug("Update Rank for rider " + JSON.stringify(raceRow));
    // Lets find first the corresponding Race row rider
    const requestedRankedRider = await this.entityManager.findOne<RaceEntity>(
      RaceEntity,
      {
        riderNumber: raceRow.riderNumber,
        raceCode: raceRow.raceCode,
        competition: { id: raceRow.competitionId }
      }
    );
    if (!requestedRankedRider) {
      Logger.warn(
        "Impossible de classer ce coureur, " +
          JSON.stringify(requestedRankedRider) +
          " il n'existe pas"
      );
      throw new BadRequestException(
        "Impossible de classer ce coureur, il n'existe pas en base de données"
      );
    }

    // Check if this rider has already a rank or is ABD
    if (requestedRankedRider.rankingScratch || requestedRankedRider.comment) {
      Logger.warn(
        "Impossible de classer ce coureur, " +
          JSON.stringify(requestedRankedRider) +
          " il existe déjà dans le classement"
      );
      throw new BadRequestException(
        "Impossible de classer le coureur au dossard " +
          requestedRankedRider.riderNumber +
          " il existe déjà dans le classement"
      );
    }
    // Check if there is existing rider with this rank in this race with the same dossard only for real Ranked update
    if (raceRow.rankingScratch) {
      const rankRiderToChange = await this.entityManager.findOne(RaceEntity, {
        rankingScratch: raceRow.rankingScratch,
        raceCode: raceRow.raceCode,
        competition: { id: raceRow.competitionId }
      });
      // If a rider already exist, it depends on the existing ranking
      // if the ranking is the one we want to change, its and edit, no problem, we remove him
      if (rankRiderToChange) {
        Logger.debug(
          "A rider exist with this rank " +
            JSON.stringify(rankRiderToChange) +
            " New Rank to update =" +
            raceRow.rankingScratch
        );
        if (rankRiderToChange.rankingScratch === raceRow.rankingScratch) {
          Logger.debug(
            "Existing rider will be removed from ranking " +
              JSON.stringify(rankRiderToChange)
          );
          rankRiderToChange.rankingScratch = null;
          rankRiderToChange.comment = null;
          await this.entityManager.save(rankRiderToChange);
        }
      }
    }
    requestedRankedRider.rankingScratch = raceRow.rankingScratch;
    requestedRankedRider.comment = raceRow.comment;
    await this.entityManager.save(requestedRankedRider);
  }

  @Delete("/:id")
  @ApiOperation({
    summary: "Supprime une course",
    operationId: "deleteRace"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async delete(@Param("id") id: string): Promise<void> {
    this.entityManager.delete(RaceEntity, id);
  }
}
