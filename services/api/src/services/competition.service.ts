import { Injectable, Logger } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../entity/user.entity";
import { Any, Between, EntityManager, Repository } from "typeorm";
import { CompetitionEntity } from "../entity/competition.entity";
import { CompetitionFilter, Departement } from "../dto/model.dto";
import * as moment from "moment";
import { FindManyOptions } from "typeorm/find-options/FindManyOptions";

@Injectable()
export class CompetitionService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly repository: Repository<CompetitionEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager
  ) {}
  async findCompetitionByFilter(
    competitionFilter: CompetitionFilter
  ): Promise<CompetitionEntity[] | undefined> {
    let startDate;
    let endDate;
    let order: "DESC" | "ASC" = "DESC";
    if (competitionFilter?.startDate)
      startDate = moment(competitionFilter?.startDate, "MM/DD/YYYY").locale(
        "fr"
      );
    if (competitionFilter?.endDate)
      endDate = moment(competitionFilter?.endDate, "MM/DD/YYYY").locale("fr");
    Logger.debug(
      "[CompetitionController] Filtre => " + JSON.stringify(competitionFilter)
    );
    const competFilter = competitionFilter.competitionTypes
      ? { competitionType: Any(Array.from(competitionFilter.competitionTypes)) }
      : null;
    const fedeFilter = competitionFilter.fedes
      ? { fede: Any(Array.from(competitionFilter.fedes)) }
      : null;
    if (!startDate || !endDate) {
      if (
        competitionFilter.displayPast &&
        competitionFilter.displayPast === true
      ) {
        // If display since is not passed we set it by default to one year => 365 days
        startDate = moment(new Date()).subtract(
          competitionFilter.displaySince ?? 3000,
          "d"
        );
      } else {
        // First minute of the current day
        startDate = moment(new Date()).startOf("day");
      }
      if (
        competitionFilter.displayFuture &&
        competitionFilter.displayFuture === true
      ) {
        order = "ASC";
        // Future is always set to 1 year, it has no sense to scope events planned in 2 or 3 years
        endDate = moment(new Date()).add(1, "y");
      } else {
        // Last minute of the current day
        endDate = moment(new Date()).endOf("day");
      }
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
        eventDate: Between(startDate, endDate),
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
        eventDate: order
      },
      relations: ["club"]
    };
    return await this.repository.find(query);
  }
}
