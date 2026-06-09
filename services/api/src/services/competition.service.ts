import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Any, Between, Not, EntityManager, Repository } from 'typeorm';
import { CompetitionEntity, findCompetitionEntityByValue } from '../entity/competition.entity';
import { CompetitionFilter, Departement } from '../dto/model.dto';
import * as moment from 'moment';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { FederationEntity, findFederationEntityByValue } from '../entity/federation.entity';

@Injectable()
export class CompetitionService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly repository: Repository<CompetitionEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}
  async findCompetitionByFilter(
    competitionFilter: CompetitionFilter,
  ): Promise<CompetitionEntity[] | undefined> {
    let startDate;
    let endDate;
    if (competitionFilter?.startDate) {
      startDate = moment(competitionFilter?.startDate, 'MM/DD/YYYY').locale(
        'fr',
      );
    }
    if (competitionFilter?.endDate) {
      endDate = moment(competitionFilter?.endDate, 'MM/DD/YYYY').locale('fr');
    }
    Logger.debug(
      '[CompetitionController] Filtre => ' + JSON.stringify(competitionFilter),
    );
    const competFilter = competitionFilter.competitionTypes
      ? { competitionType: Any(Array.from(competitionFilter.competitionTypes).map(findCompetitionEntityByValue)) }
      : null;
    // L'app V1 (ancienne, sans pagination lazy) ne tient pas le volume des
    // randos FFVELO → on EXCLUT toujours la fédé FFVELO de cette recherche,
    // même si le front l'envoie dans les paramètres (le filtre FFVELO est ignoré).
    let fedeFilter;
    if (competitionFilter.fedes) {
      const fedes = Array.from(competitionFilter.fedes)
        .map(findFederationEntityByValue)
        .filter((f) => f && f !== FederationEntity.FFVELO);
      fedeFilter = { fede: Any(fedes) };
    } else {
      fedeFilter = { fede: Not(FederationEntity.FFVELO) };
    }
    if (!startDate || !endDate) {
      if (
        competitionFilter.displayPast &&
        competitionFilter.displayPast === true
      ) {
        // If display since is not passed we set it by default to one year => 365 days
        startDate = moment(new Date()).subtract(
          competitionFilter.displaySince ?? 1000,
          'd',
        );
      } else {
        // First minute of the current day
        startDate = moment(new Date()).startOf('day');
      }
      if (
        competitionFilter.displayFuture &&
        competitionFilter.displayFuture === true
      ) {
        // Future is always set to 1 year, it has no sense to scope events planned in 2 or 3 years
        endDate = moment(new Date()).add(1, 'y');
      } else {
        // Last minute of the current day
        endDate = moment(new Date()).endOf('day');
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
                  (dept: Departement) => dept.departmentCode,
                ),
              ),
            }
          : null),
      },
      // Tri ASC pour que la troncature `take` garde les épreuves les PLUS
      // PROCHES (et non les plus lointaines) dans la fenêtre du filtre.
      order: {
        eventDate: 'ASC',
      },
      relations: ['club'],
      // Tronque le nombre de résultats : l'app V1 plante en chargeant trop
      // d'éléments sur la carte. On limite côté requête plutôt que de lever
      // une erreur (TooMuchResults mal gérée côté V1 → runtime error).
      take: 1000,
    };
    return await this.repository.find(query);
  }
}
