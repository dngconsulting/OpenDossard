import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Delete,
  UseGuards
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import {
  Any,
  Between,
  EntityManager,
  EntityRepository,
  Repository
} from "typeorm";
import {
  Category,
  CompetitionEntity,
  CompetitionType
} from "../entity/competition.entity";
import { RaceEntity } from "../entity/race.entity";
import { AuthGuard } from "@nestjs/passport";
import {
  CompetitionCreate,
  CompetitionFilter,
  CompetitionReorganize,
  Departement
} from "../dto/model.dto";
import * as moment from "moment";
import { TooMuchResults } from "../exception/TooMuchResults";
import { ROLES, RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { FindManyOptions } from "typeorm/find-options/FindManyOptions";
import { ClubEntity } from "src/entity/club.entity";
import { plainToClass } from "class-transformer";
import * as _ from "lodash";

const MAX_COMPETITION_TO_DISPLAY = 5000;
/**
 * Competition Controller handles all competitions operation ('Epreuve' in french)
 * The Reorganization method is when races are reorganized by categories
 */
@Controller("/api/competition")
@ApiTags("CompetitionAPI")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class CompetitionController {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly repository: Repository<CompetitionEntity>,
    @InjectRepository(ClubEntity)
    private readonly clubRepository: Repository<ClubEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager
  ) {}

  @Get(":id")
  @ApiOperation({
    operationId: "getCompetition",
    summary: "Recherche d'une épreuve par ID",
    description: "Recherche une épreuve par son identifiant"
  })
  @ApiResponse({
    status: 200,
    type: CompetitionEntity,
    isArray: false,
    description: "Renvoie une épreuve"
  })
  @Roles(ROLES.MOBILE, ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async get(@Param("id") id: string): Promise<CompetitionEntity> {
    const response = await this.repository.find({
      order: {
        eventDate: "ASC"
      },
      where: { id },
      relations: ["club"]
    });

    if (response.length !== 1) {
      throw new BadRequestException(`Competition ${id} not found`);
    }

    return response[0];
  }

  @ApiOperation({
    operationId: "getCompetitionsByFilter",
    summary:
      "Rechercher toutes les compétitions correspondant au filtre passé en paramètre",
    description: "Recherche toutes les compétitions disponibles dans le filtre"
  })
  @ApiResponse({
    status: 200,
    type: CompetitionEntity,
    isArray: true,
    description:
      "Rechercher toutes les compétitions correspondant au filtre passé en paramètre"
  })
  @Post()
  @Roles(ROLES.MOBILE, ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async getCompetitionsByFilter(
    @Body() competitionFilter: CompetitionFilter
  ): Promise<CompetitionEntity[]> {
    let futureEventDate;
    let pastEventDate;
    console.log(
      "[CompetitionController] Filtre => " + JSON.stringify(competitionFilter)
    );
    const competFilter = competitionFilter.competitionTypes
      ? { competitionType: Any(Array.from(competitionFilter.competitionTypes)) }
      : null;
    const fedeFilter = competitionFilter.fedes
      ? { fede: Any(Array.from(competitionFilter.fedes)) }
      : null;
    if (
      competitionFilter.displayPast &&
      competitionFilter.displayPast === true
    ) {
      // If display since is not passed we set it by default to one year => 365 days
      pastEventDate = moment(new Date())
        .subtract(
          competitionFilter.displaySince ? competitionFilter.displaySince : 365,
          "d"
        )
        .toDate();
    } else {
      // First minute of the current day
      pastEventDate = moment(new Date()).startOf("day");
    }
    if (
      competitionFilter.displayFuture &&
      competitionFilter.displayFuture === true
    ) {
      // Future is always set to 1 year, it has no sense to scope events planned in 2 or 3 years
      futureEventDate = moment(new Date())
        .add(1, "y")
        .toDate();
    } else {
      // Last minute of the current day
      futureEventDate = moment(new Date()).endOf("day");
    }
    const query: FindManyOptions<CompetitionEntity> = {
      where: {
        ...competFilter,
        ...fedeFilter,
        ...(competitionFilter.openedToOtherFede
          ? { openedToOtherFede: competitionFilter.openedToOtherFede }
          : null),
        ...(competitionFilter.openedNL
          ? { openedNL: competitionFilter.openedNL }
          : null),
        eventDate: Between(pastEventDate, futureEventDate),
        ...(competitionFilter.depts && competitionFilter.depts.length > 0
          ? {
              dept: Any(
                competitionFilter.depts.map(
                  (dept: Departement) => dept.departmentCode
                )
              )
            }
          : null)
      },
      order: {
        eventDate: "DESC"
      },
      relations: ["club"]
    };
    console.log("[CompetitionController] Query =" + JSON.stringify(query));
    const result: CompetitionEntity[] = await this.repository.find(query);

    if (result.length > MAX_COMPETITION_TO_DISPLAY) {
      throw new TooMuchResults();
    }

    return result;
  }

  @Post("/reorganize")
  @ApiOperation({
    operationId: "reorganize",
    summary: "Réorganisation des courses"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async reorganize(@Body() dto: CompetitionReorganize): Promise<void> {
    const start = new Date().getTime();
    const competition = await this.repository.findOne(dto.competitionId);
    if (!competition) {
      throw new BadRequestException(
        `Competition ${dto.competitionId} not found`
      );
    }
    dto.races = dto.races.filter(race => race.trim().length);

    const rows = await this.entityManager.find<RaceEntity>(RaceEntity, {
      competition: { id: dto.competitionId }
    });
    Logger.debug("Rows to update found = " + JSON.stringify(rows));
    let end = new Date().getTime();
    Logger.debug(
      "Perf After finding races rows and current competition " +
        (end - start) +
        "ms"
    );
    dto.races.map(race => race.split("/"));

    rows.forEach(row => {
      row.raceCode = dto.races.filter(
        race => race.split("/").indexOf(row.catev) >= 0
      )[0];
      Logger.debug("Saving Row " + JSON.stringify(row));
      this.entityManager.save(row);
    });
    end = new Date().getTime();
    Logger.debug("Perf After saving all races rows " + (end - start) + "ms");
    competition.races = dto.races;
    await this.entityManager.save(competition);
  }

  @Post("/saveInfoGen")
  @ApiOperation({
    operationId: "saveInfoGen",
    summary:
      "Sauvegarde les informations générales d'une épreuve (Speaker, Aboyeur, Commissaires,...)"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async saveInfoGen(
    @Body() competitionToSave: CompetitionEntity
  ): Promise<CompetitionEntity> {
    const competition = await this.repository.findOne(competitionToSave.id);
    if (!competition) {
      throw new NotFoundException(
        "Epreuve " + competitionToSave.name + " Introuvable"
      );
    }
    competition.feedback = competitionToSave.feedback;
    if (competition.competitionType === CompetitionType.CX) {
      competition.aboyeur = competitionToSave.aboyeur;
    }
    competition.commissaires = competitionToSave.commissaires;
    competition.speaker = competitionToSave.speaker;
    competitionToSave.isValidResults != null &&
      (competition.isValidResults = competitionToSave.isValidResults);
    return await this.repository.save(competition);
  }

  @Post("/saveCompetition")
  @ApiOperation({
    operationId: "saveCompetition",
    summary: "Création d'une épreuve X"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async upsertCompetition(
    @Body() dto: CompetitionCreate
  ): Promise<CompetitionCreate> {
    if (!dto.competitionType) {
      throw new BadRequestException(
        "le type de la compétition doit être renseigné."
      );
    }
    if (dto.name === "" || !dto.name) {
      throw new BadRequestException(
        "le nom de la compétition doit être renseigné"
      );
    }
    if (!dto.categories) {
      throw new BadRequestException(
        "les catégories gérées par la compétition doivent être renseignées"
      );
    }
    if (!dto.races) {
      throw new BadRequestException(
        "les catégories gérées par la compétition doivent être renseignées"
      );
    }
    if (!dto.eventDate) {
      throw new BadRequestException(
        "la date de l'épreuve doit être renseignée"
      );
    }
    if (dto.zipCode === "" || !dto.zipCode) {
      throw new BadRequestException(
        "le code postal de la compétition doit être renseigné"
      );
    }
    if (dto.clubId === null) {
      throw new BadRequestException(
        "le club organisant la compétition doit être renseigné"
      );
    }

    const competition = new CompetitionEntity();

    const club = await this.clubRepository.findOne(dto.clubId);
    competition.id = dto.id;
    competition.name = dto.name;
    competition.eventDate = dto.eventDate;
    competition.zipCode = dto.zipCode;
    competition.dept = dto.zipCode.substr(0, 2);
    competition.info = dto.info;
    competition.website = dto.website;
    competition.circuitLength = dto.circuitLength;
    competition.club = club;
    competition.contactPhone = dto.contactPhone;
    competition.facebook = dto.facebook;
    competition.contactEmail = dto.contactEmail;
    competition.categories = dto.categories;
    competition.fede = dto.fede;
    competition.competitionType = dto.competitionType;
    competition.competitionInfo = dto.competitionInfo;
    competition.races = dto.races;
    competition.contactName = dto.contactName;
    competition.gpsCoordinates = dto.gpsCoordinates;
    competition.feedback = dto.feedback;
    competition.localisation = dto.localisation;
    competition.observations = dto.observations;
    competition.isOpenedToNL = dto.isOpenedToNL;
    competition.isOpenedToOtherFede = dto.isOpenedToOtherFede;
    competition.pricing = dto.pricing;
    competition.speaker = dto.speaker;
    competition.aboyeur = dto.aboyeur;
    competition.commissaires = dto.commissaires;
    competition.photoUrls = dto.photoUrls;
    // For new competition reset the sequence in case other have insert rows in competition table
    if (!competition.id)
      await this.entityManager.connection.manager.query(
        "SELECT SETVAL('public.competition_id_seq', COALESCE(MAX(id), 1) ) FROM public.competition"
      );
    // Clean all empty values
    for (const propertyName in competition) {
      if (!competition[propertyName] || _.isEmpty(competition[propertyName]))
        if (
          (propertyName !== "gpsCoordinates" &&
            typeof competition[propertyName] === "string") ||
          Array.isArray(competition[propertyName])
        ) {
          Logger.debug("Delete propertyName");
          delete competition[propertyName];
        }
    }
    const updatedCompetitionEntity = await this.repository.save(competition);
    const competitionUpserted: CompetitionCreate = plainToClass(
      CompetitionCreate,
      updatedCompetitionEntity
    );
    competitionUpserted.clubId = updatedCompetitionEntity.club.id;
    return competitionUpserted;
  }

  @Delete(":id")
  @ApiOperation({
    operationId: "deleteCompetition",
    summary: "Supprime une épreuve"
  })
  @ApiResponse({ status: 204, isArray: false })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async deleteCompetition(@Param("id") id: number): Promise<void> {
    const competition = await this.repository.findOne(id);
    if (!competition) {
      throw new BadRequestException(`Competition ${id} not found`);
    }
    await this.entityManager.remove(competition);
  }
}
