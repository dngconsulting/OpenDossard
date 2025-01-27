import { LicenceEntity } from "../entity/licence.entity";
import { EntityManager, Repository } from "typeorm";
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Logger,
  Param,
  Post,
  Put,
  Scope,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Filter, LicencesPage, Search } from "../dto/model.dto";
import { AuthGuard } from "@nestjs/passport";
import { ROLES, RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";
import {
  formatDepartement,
  getCateaFromBirthYear,
  getGenreFromCsvElicence,
  mappingLicenceFields,
  stripBOM
} from "../util";
import { CompetitionType } from "../entity/competition.entity";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { UserEntity } from "../entity/user.entity";
import { FileInterceptor } from "@nestjs/platform-express";
import { Readable } from "stream";
import { LicenceService } from "../services/licence.service";
import { ClubEntity } from "../entity/club.entity";
import { FederationEntity } from "../entity/federation.entity";
import * as _ from "lodash";

const csv = require("csv-parser");

/**
 * Licence Controler is in charge of handling rider licences
 * Mainly Crud operations & pagination
 */
@Controller("/api/licences")
@ApiTags("LicenceAPI")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Injectable({ scope: Scope.REQUEST })
export class LicenceController {
  constructor(
    @InjectRepository(ClubEntity)
    private readonly repositoryClub: Repository<ClubEntity>,
    private readonly licenceService: LicenceService,
    @InjectRepository(LicenceEntity)
    private readonly repository: Repository<LicenceEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  @Get("/search/:param/:competitionType")
  @ApiOperation({
    operationId: "getLicencesLike",
    summary: "Recherche des licences",
    description:
      "Rechercher des licences en fonction, du nom, prénom ou numéro de licence "
  })
  @ApiResponse({
    status: 200,
    type: LicenceEntity,
    isArray: true,
    description: "Liste des licences"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN, ROLES.MOBILE)
  public async getLicencesLike(
    @Param("param") param: string,
    @Param("competitionType") competitionType: CompetitionType
  ): Promise<LicenceEntity> {
    const filterParam =
      "%" +
      param
        .replace(/\s+/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") +
      "%";
    const query: string = `select l.licence_number as "licenceNumber",
                                      l.id,
                                      l.club,
                                      l.gender,
                                      l.name,
                                      l.dept,
                                      l.fede,
                                      l.first_name     as "firstName",
                                      l.birth_year     as "birthYear",
                                      ${
                                        competitionType === CompetitionType.CX
                                          ? 'l.catev_cx as "catev"'
                                          : 'l.catev as "catev"'
                                      },
                                      l.saison,
                                      l.comment,
                                      l.catea
                               from licence l
                               where REPLACE(CONCAT(UPPER(l.name), UPPER(unaccent(l.first_name)),
                                                    UPPER(CAST(l.fede AS VARCHAR)), UPPER(l.licence_number)), ' ',
                                             '') like $1
                               order by (l.name, l.first_name) fetch first 30 rows only`;
    return await this.entityManager.query(query, [filterParam]);
  }

  @Get(":id")
  @ApiOperation({
    operationId: "get",
    summary: "Rechercher une licence par ID ",
    description: "Recherche une licence par son identifiant"
  })
  @ApiResponse({
    status: 200,
    type: LicenceEntity,
    isArray: false,
    description: "Renvoie une licence"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN, ROLES.MOBILE)
  public async get(@Param("id") id: string): Promise<LicenceEntity> {
    return await this.repository
      .createQueryBuilder()
      .where("id = :id", { id })
      .getOne();
  }

  @ApiOperation({
    operationId: "getAllLicences",
    summary: "Rechercher toutes les licences ",
    description: "Renvoie toutes les licences"
  })
  @ApiResponse({
    status: 200,
    type: LicenceEntity,
    isArray: true,
    description: "Liste des licences"
  })
  @Get()
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async getAllLicences(): Promise<LicenceEntity[]> {
    return this.repository.find();
  }

  @ApiOperation({
    operationId: "getPageSizeLicencesForPage",
    summary: "Rechercher par page les licences ",
    description:
      "Recherche paginée utilisant currentPage, pageSize, orderDirection, orderBy et Filters"
  })
  @Post("/filter")
  @ApiResponse({ status: 200, type: LicencesPage })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async getPageSizeLicencesForPage(
    @Body() search: Search
  ): Promise<LicencesPage> {
    Logger.debug("Search=" + JSON.stringify(search));
    const qb = this.repository.createQueryBuilder();
    if (search.search === "") {
      const fid: Filter[] = search.filters.filter(
        (f: Filter) => f.name === "id"
      );
      if (fid.length > 0) {
        qb.andWhere("id=:id", { id: fid.pop().value });
      } else {
        search.filters.forEach((filter: Filter) => {
          if (mappingLicenceFields[filter.name] === "comment") {
            qb.andWhere(
              mappingLicenceFields[filter.name] +
                " = '' is " +
                (filter.value.toLowerCase() === "o" ? "" : "not") +
                " false"
            );
          } else
            qb.andWhere(
              mappingLicenceFields[filter.name] + " ilike :" + filter.name,
              { [filter.name]: "%" + filter.value + "%" }
            );
        });

        if (typeof search.orderBy !== "undefined") {
          qb.orderBy(
            `"${mappingLicenceFields[search.orderBy]}"`,
            search.orderDirection
          );
        } else {
          qb.orderBy("name", search.orderDirection);
        }
      }
    } else {
      const filterParam =
        "%" +
        search.search
          .replace(/\s+/g, "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") +
        "%";
      qb.where(
        "REPLACE(CONCAT(UPPER(name),UPPER(unaccent(first_name)),UPPER(CAST(fede AS VARCHAR)),UPPER(licence_number)),' ','') ilike :value",
        { value: "%" + filterParam + "%" }
      );
    }
    const res = await qb
      .skip(search.currentPage * search.pageSize)
      .take(search.pageSize)
      .getManyAndCount();
    return { data: res[0], page: search.currentPage, totalCount: res[1] };
  }

  // TODO : It is also possible to use @Transaction decorator here
  // See https://typeorm.io/#/transactions
  @Post()
  @ApiOperation({
    operationId: "create",
    summary: "Cree une nouvelle licence"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async create(@Body() licence: LicenceEntity): Promise<LicenceEntity> {
    const currentUser: UserEntity = this.request["user"] as UserEntity;
    return this.licenceService.createLicence(
      licence,
      currentUser.email +
        "/" +
        currentUser.firstName +
        "/" +
        currentUser.lastName
    );
  }

  @Put()
  @ApiOperation({
    summary: "Met à jour une licence existante",
    operationId: "update"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async update(@Body() licence: LicenceEntity): Promise<void> {
    const currentUser: UserEntity = this.request["user"] as UserEntity;
    const toUpdate = await this.entityManager.findOne(
      LicenceEntity,
      licence.id
    );
    toUpdate.licenceNumber = licence.licenceNumber;
    toUpdate.fede = licence.fede;
    toUpdate.club = licence.club;
    toUpdate.birthYear = licence.birthYear;
    toUpdate.name = licence.name;
    toUpdate.firstName = licence.firstName;
    toUpdate.gender = licence.gender.toUpperCase();
    toUpdate.dept = licence.dept;
    toUpdate.catea = licence.catea;
    toUpdate.catev = licence.catev;
    toUpdate.comment = licence.comment;
    if (licence.catevCX && licence.catevCX.length > 0)
      toUpdate.catevCX = licence.catevCX;
    else toUpdate.catevCX = null;
    toUpdate.saison = licence.saison;
    toUpdate.author =
      currentUser.email +
      "/" +
      currentUser.firstName +
      "/" +
      currentUser.lastName;

    toUpdate.lastChanged = new Date();
    await this.entityManager.save(toUpdate);
  }

  @Delete("/:id")
  @ApiOperation({
    summary: "Supprime une licence",
    operationId: "delete"
  })
  @Roles(ROLES.ORGANISATEUR, ROLES.ADMIN)
  public async delete(@Param("id") id: string): Promise<void> {
    await this.entityManager.delete(LicenceEntity, id);
  }

  @UseInterceptors(FileInterceptor("file"))
  @Post("/upload/elicence")
  @Roles(ROLES.ADMIN)
  public async uploadFile(
    @UploadedFile() file: Express.Multer.File
  ): Promise<string> {
    type RiderCsvType = Partial<LicenceEntity> & {
      active: string;
      elicenceClubName: string;
      birthDay: string;
    };
    const ridersToCreate: Array<RiderCsvType> = [];
    const ridersToUpdate: Array<RiderCsvType> = [];
    const allRiders: Array<RiderCsvType> = [];
    const currentUser: UserEntity = this.request["user"] as UserEntity;
    return new Promise((resolve, reject) => {
      // 031 FSGT 31 - ici on récupère le 31
      const pattern = /\d+$/;
      Readable.from(stripBOM(file.buffer))
        .pipe(csv({ separator: ";" }))
        .on("data", async data => {
          allRiders.push({
            name: data["Nom"]?.trim(),
            firstName: data["Prénom"]?.trim(),
            saison: data["Saison"]?.trim(),
            elicenceClubName:
              data["Nom Club"]?.trim() ?? data["Nom club"]?.trim(),
            catea: data["Catégorie d'âge vélo"]?.trim(),
            active: data["État"]?.trim(),
            birthDay: data["DDN"]?.trim() ?? data["Date de naissance"]?.trim(),
            licenceNumber:
              data["Code adhérent"]?.trim() ?? data["Numéro adhérent"]?.trim(),
            catev: data["Niveau Route"]?.trim(),
            catevCX: data["Niveau Cyclo-Cross"]?.trim(),
            dept:
              data["Code Comité Départemental"] ??
              data["Comité Départemental"]?.match(pattern)[0].trim(),
            gender: getGenreFromCsvElicence(
              data["Genre"]?.trim() ?? data["Civilité"]?.trim()
            )
          });
        })
        .on("end", async () => {
          let message =
            "<br>------------ Résultats du traitement ----------------";
          for (const csvRider of allRiders) {
            let changed = false;
            if (
              !csvRider.licenceNumber ||
              !csvRider.firstName ||
              !csvRider.name ||
              !csvRider.gender ||
              !csvRider.elicenceClubName ||
              !csvRider.saison
            ) {
              console.log(
                `Licence impossible à créer : le genre, numéro, le prénom, le nom, le club ou la saison sont inexistants ${JSON.stringify(
                  csvRider
                )}`
              );
              continue;
            }
            console.log(
              "On traite " +
                csvRider.firstName +
                " " +
                csvRider.name +
                " " +
                csvRider.licenceNumber
            );
            // Pour chaque licence, on vérifie si une licence existe avec le même numéro
            let existingRider = await this.licenceService.getLicenceByNumber(
              csvRider.licenceNumber
            );
            // Si le licencié n'existe pas, on recherche par date de naissance, nom et prénom
            if (!existingRider) {
              console.log(
                "On n'a pas trouvé " +
                  csvRider.name +
                  " " +
                  csvRider.firstName +
                  " avec ce numéro " +
                  csvRider.licenceNumber
              );
              existingRider = await this.licenceService.getRiderByBirthYearAndName(
                csvRider.birthDay.slice(-4),
                csvRider.name,
                csvRider.firstName
              );
              if (existingRider) {
                console.log(
                  "Mais on l'a trouvé avec ces informations, il sera mis à jour " +
                    JSON.stringify(existingRider)
                );
              } else
                console.log(
                  `Licence de ${JSON.stringify(
                    csvRider
                  )} introuvable, on essaye de le rajouter `
                );
            }
            if (existingRider) {
              // On récupère son club et on le met à jour si celui de la elicence est différent
              if (
                csvRider.elicenceClubName &&
                csvRider.elicenceClubName !== ""
              ) {
                console.log(
                  "On recherche le club " + csvRider.elicenceClubName
                );
                const club = await this.repositoryClub.findOne({
                  elicenceName: csvRider.elicenceClubName
                });
                if (!club)
                  console.log(`Club ${csvRider.elicenceClubName} non trouvé `);
                if (
                  club &&
                  existingRider.club !== club.longName &&
                  club.longName != ""
                ) {
                  existingRider.club = club.longName;
                  changed = true;
                }
              }
              // S'il y a un num de licence et c'est le même ne rien faire, sinon mettre à jour
              // C'est peut-être un ancien coureur dont le numéro datait de l'avant elicence
              if (
                csvRider.licenceNumber !== undefined &&
                csvRider.licenceNumber !== "" &&
                existingRider.licenceNumber !== csvRider.licenceNumber
              ) {
                existingRider.licenceNumber = csvRider.licenceNumber;
                changed = true;
              }
              // Si le nom et prénom sont différents, on met à jour pour que ce soit cohérent par rapport à elicence
              if (
                csvRider.firstName !== undefined &&
                csvRider.firstName !== "" &&
                existingRider.firstName.trim() !== csvRider.firstName
              ) {
                existingRider.firstName = csvRider.firstName;
                changed = true;
              }
              if (
                csvRider.name !== undefined &&
                csvRider.name !== "" &&
                existingRider.name.trim() !== csvRider.name
              ) {
                existingRider.name = csvRider.name;
                changed = true;
              }
              // on met à jour la saison
              if (
                csvRider.saison !== undefined &&
                csvRider.saison !== "" &&
                existingRider.saison.trim() !== csvRider.saison
              ) {
                existingRider.saison = csvRider.saison;
                changed = true;
              }
              // On met à jour les catés de valeur par rapport à la elicence
              if (csvRider.catev !== "" && csvRider.catev) {
                if (!existingRider.catev) {
                  existingRider.catev = csvRider.catev;
                  changed = true;
                } else {
                  if (existingRider.catev !== csvRider.catev) {
                    message += `<br> ATTENTION : ${existingRider.firstName} ${existingRider.name} ${existingRider.licenceNumber} catégorie de valeur ROUTE OD ${existingRider.catev} - caté Elicence ${csvRider.catev} `;
                  }
                }
              }
              // On met à jour les catés CX de valeur par rapport à la elicence
              if (csvRider.catevCX !== "" && csvRider.catevCX) {
                if (!existingRider.catevCX) {
                  existingRider.catevCX = csvRider.catevCX;
                  changed = true;
                } else {
                  if (existingRider.catevCX !== csvRider.catevCX) {
                    message += `<br> ATTENTION : ${existingRider.firstName} ${existingRider.name} ${existingRider.licenceNumber} catégorie de valeur CX OD ${existingRider.catevCX} - caté Elicence ${csvRider.catevCX} `;
                  }
                }
              }
              // On met à jour la catégorie d'age
              if (csvRider.birthDay) {
                const resultCateA = getCateaFromBirthYear(
                  csvRider.birthDay.slice(-4),
                  csvRider.gender
                );
                if (resultCateA !== existingRider.catea) {
                  existingRider.catea = resultCateA;
                  changed = true;
                }
              }
              // On met à jour l'année de naissance
              if (csvRider.birthDay !== "" && csvRider.birthDay) {
                if (csvRider.birthDay.slice(-4) !== existingRider.birthYear) {
                  existingRider.birthYear = csvRider.birthDay.slice(-4);
                  changed = true;
                }
              }
              // On met à jour le dept au cas où
              if (
                csvRider.dept &&
                formatDepartement(csvRider.dept) !== existingRider.dept
              ) {
                existingRider.dept = formatDepartement(csvRider.dept);
                changed = true;
              }
              if (changed) {
                existingRider.lastChanged = new Date();
                existingRider.author =
                  currentUser.email +
                  "/" +
                  currentUser.firstName +
                  "/" +
                  currentUser.lastName +
                  "/ImportCSV";
              }
              if (changed) {
                await this.repository.save(existingRider);
                message += `<br>Licencié ${existingRider.firstName +
                  " " +
                  existingRider.name +
                  " " +
                  existingRider.licenceNumber} mis à jour avec ${JSON.stringify(
                  existingRider
                )}`;
                ridersToUpdate.push(csvRider);
              }
            } else {
              // Création d'une nouvelle licence
              const newLicence: LicenceEntity = new LicenceEntity();
              newLicence.id = null;
              newLicence.licenceNumber = csvRider.licenceNumber;
              newLicence.firstName = csvRider.firstName;
              newLicence.name = csvRider.name;
              newLicence.gender = csvRider.gender;
              const club = await this.repositoryClub.findOne({
                elicenceName: csvRider.elicenceClubName
              });
              if (!club) {
                console.log(`Club ${csvRider.elicenceClubName} non trouvé `);
                message += `Le club ${csvRider.elicenceClubName} n'existe pas, création impossible de la licence ${newLicence.licenceNumber}`;
                continue;
              }
              if (club) {
                newLicence.club = club.longName;
              }
              newLicence.dept = formatDepartement(csvRider.dept);
              newLicence.birthYear = csvRider.birthDay.slice(-4);
              if (csvRider.birthDay) {
                const resultCateA = getCateaFromBirthYear(
                  csvRider.birthDay.slice(-4),
                  csvRider.gender
                );
                if (resultCateA != "") {
                  newLicence.catea = resultCateA;
                } else newLicence.catea = "NC";
              }
              if (csvRider.catev != "" && csvRider.catev) {
                newLicence.catev = csvRider.catev;
              }
              if (csvRider.catevCX != "" && csvRider.catevCX) {
                newLicence.catevCX = csvRider.catevCX;
              }
              newLicence.fede = FederationEntity.FSGT;
              newLicence.saison = csvRider.saison;
              newLicence.lastChanged = new Date();
              await this.licenceService.createLicence(
                newLicence,
                currentUser.email +
                  "/" +
                  currentUser.firstName +
                  "/" +
                  currentUser.lastName +
                  "/ImportCSV"
              );
              message += `<br>Licencié ${newLicence.firstName +
                " " +
                newLicence.name +
                " " +
                newLicence.licenceNumber} ajouté avec ${JSON.stringify(
                newLicence
              )}`;
              ridersToCreate.push(csvRider);
            }
          }
          message += `<br>--------------- Licences inchangées -----------------------------`;
          message += `<br> Ignorés : ${JSON.stringify(
            _.differenceWith(
              allRiders,
              [...ridersToUpdate, ...ridersToCreate],
              _.isEqual
            )
          )}`;
          message += `<br>--------------------------------------------`;
          message += `<br> ${ridersToUpdate.length} Licence(s) mises à jour`;
          message += `<br> ${ridersToCreate.length} Licence(s) créées`;
          message += `<br> ${allRiders.length -
            (ridersToUpdate.length +
              ridersToCreate.length)} Licence(s) inchangée(s)`;

          message += "<br>------------ Traitement terminé ----------------";
          resolve(message);
        });
    });
  }
}
