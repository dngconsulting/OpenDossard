import { BadRequestException, Body, Controller, Get, Logger, NotFoundException, Param, Post, UseGuards} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {Any, Between, EntityManager, Repository} from 'typeorm';
import {CompetitionEntity, CompetitionType} from '../entity/competition.entity';
import {RaceEntity} from '../entity/race.entity';
import {AuthGuard} from '@nestjs/passport';
import {CompetitionFilter, CompetitionReorganize, CompetitionsPage, Departement, Search} from '../dto/model.dto';
import * as moment from 'moment';
import {TooMuchResults} from "../exception/TooMuchResults";
import {ROLES, RolesGuard} from "../guards/roles.guard";
import {Roles} from "../decorators/roles.decorator";
import {FindManyOptions} from "typeorm/find-options/FindManyOptions";

const MAX_COMPETITION_TODISPLAY = 5000;
/**
 * Competition Controller handles all competitions operation ('Epreuve' in french)
 * The Reorganization method is when races are reorganized by categories
 */
@Controller('/api/competition')
@ApiTags('CompetitionAPI')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CompetitionController {
    constructor(
        @InjectRepository(CompetitionEntity)
        private readonly repository: Repository<CompetitionEntity>,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @Get(':id')
    @ApiOperation({
        operationId: 'getCompetition',
        summary: 'Recherche d\'une épreuve par ID',
        description: 'Recherche une épreuve par son identifiant',
    })
    @ApiResponse({
        status: 200,
        type: CompetitionEntity,
        isArray: false,
        description: 'Renvoie une épreuve',
    })
    @Roles(ROLES.MOBILE,ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async get(@Param('id') id: string): Promise<CompetitionEntity> {
        const r = await this.repository.find({
            order: {
                eventDate: 'ASC',
            },
            where: {id},
            relations: ['club'],
        });

        if (r.length !== 1) {
            throw new BadRequestException(`Competition ${id} not found`);
        }

        return r[0];
    }

    @Post('/filter')
    @ApiOperation({
        operationId: 'getCompetitionByFilterAndPage',
        summary: 'Rechercher les compétitions correspondantes au filtre et à la pagination de la recherche',
    })
    @ApiResponse({
        status: 200,
        type: CompetitionsPage,
        description: 'Ensemble de compétitions correspondantes au filtre et à la pagination de la recherche',
    })
    @Roles(ROLES.MOBILE, ROLES.ORGANISATEUR, ROLES.ADMIN)
    public async getCompetitionByFilterAndPage(@Body() search: Search): Promise<CompetitionsPage> {
        const qb = this.repository.createQueryBuilder('comp');

        search.filters.map(filter => {
            if (filter.name === 'fedes') {
                if (filter.value.length > 0) {
                    qb.andWhere('comp.fede IN(:...fedes)', {fedes: filter.value});
                }
            } else if (filter.name === 'pastOrFuture') {
                if (filter.value.past && !filter.value.future) {
                    qb.andWhere('comp.eventDate <= :date', {date: moment().endOf('day')});
                } else if (filter.value.future && !filter.value.past) {
                    qb.andWhere('comp.eventDate >= :date', {date: moment().startOf('day')});
                }
            } else if (filter.name === 'types') {
                if (filter.value.length > 0) {
                    qb.andWhere('comp.competitionType IN(:...types)', {types: filter.value});
                }
            } else if (filter.name === 'depts') {
                if (filter.value.length > 0) {
                    qb.andWhere('comp.dept IN (:...depts)', {depts: filter.value});
                }
            } else if (filter.name === 'club.longName') {
                qb.andWhere('club.longName ilike :club', {club: `%${filter.value}%`});
            } else if (filter.name === 'eventDate') {
                qb.andWhere("to_char(comp.eventDate,  'DD/MM/YYY') ilike :date", {date: `%${filter.value}%`});
            } else {
                // For other column, ilike on the field
                qb.andWhere(`comp.${filter.name} ::text ilike :value`, {value: `%${filter.value}%`});
            }
        });

        if (search.orderDirection && search.orderBy) {
            qb.orderBy(`comp.${search.orderBy}`, search.orderDirection);
        } else {
            qb.orderBy('comp.eventDate', 'DESC');
        }

        const [result, count] = await
            qb
                .leftJoinAndSelect('comp.club', 'club')
                .skip(search.currentPage * search.pageSize)
                .take(search.pageSize)
                .getManyAndCount();

        return {
            data: result,
            totalCount: count,
        };
    }

    @ApiOperation({
        operationId: 'getCompetitionsByFilter',
        summary: 'Rechercher Toutes les compétitions correspondant au filtre passé en paramètre',
        description: 'Recherche toutes les compétitions disponibles dans le filtre',
    })
    @ApiResponse({
        status: 200,
        type: CompetitionEntity,
        isArray: true,
        description: 'Rechercher Toutes les compétitions correspondant au filtre passé en paramètre',
    })
    @Post()
    @Roles(ROLES.MOBILE,ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async getCompetitionsByFilter(@Body() competitionFilter : CompetitionFilter): Promise<CompetitionEntity[]> {
        let futureEventDate,pastEventDate;
        console.log('[CompetitionController] Filtre => ' + JSON.stringify(competitionFilter));
        const competFilter= competitionFilter.competitionTypes ? {competitionType: Any(Array.from(competitionFilter.competitionTypes))}:null
        const fedeFilter=  competitionFilter.fedes? {fede: Any(Array.from(competitionFilter.fedes))}:null
        if (competitionFilter.displayPast && competitionFilter.displayPast===true) {
            // If display since is not passed we set it by default to one year => 365 days
            pastEventDate=moment(new Date()).subtract(competitionFilter.displaySince?competitionFilter.displaySince:365,'d').toDate()
        } else {
            // First minute of the current day
            pastEventDate=moment(new Date()).startOf('day');
        }
        if (competitionFilter.displayFuture && competitionFilter.displayFuture===true) {
            // Future is always set to 1 year, it has no sense to scope events planned in 2 or 3 years
            futureEventDate=moment(new Date()).add(1,'y').toDate()
        } else {
            // Last minute of the current day
            futureEventDate=moment(new Date()).endOf('day');
        }
        const query : FindManyOptions<CompetitionEntity> = {
            where: {
                ...(competFilter),
                ...(fedeFilter),
                ...(competitionFilter.openedToOtherFede?{openedToOtherFede:competitionFilter.openedToOtherFede}:null),
                ...(competitionFilter.openedNL?{openedNL:competitionFilter.openedNL}:null),
                eventDate:Between(pastEventDate,futureEventDate),
                ...(competitionFilter.depts && competitionFilter.depts.length>0?{dept:Any(competitionFilter.depts.map((dept:Departement)=>dept.departmentCode))}:null)
            },
            order: {
                eventDate: 'DESC',
            },
            relations: ['club'],
        }
        console.log('[CompetitionController] Query =' + JSON.stringify(query))
        const result: CompetitionEntity[] = await this.repository.find(query);

        if (result.length>MAX_COMPETITION_TODISPLAY) {
            throw new TooMuchResults();
        }

        return result;
    }

    @Post('/reorganize')
    @ApiOperation({
        operationId: 'reorganize',
        summary: 'Réorganisation des courses',
    })
    @ApiResponse({status: 200, isArray: false})
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async reorganize(@Body() dto: CompetitionReorganize): Promise<void> {
        const start = (new Date()).getTime();
        const competition = await this.repository.findOne(dto.competitionId);
        if (!competition) {
            throw new BadRequestException(`Competition ${dto.competitionId} not found`);
        }
        dto.races = dto.races.filter(race => race.trim().length);

        const rows = await this.entityManager.find<RaceEntity>(RaceEntity, {competition: {id: dto.competitionId}});
        Logger.debug('Rows to update found = ' + JSON.stringify(rows));
        let end = (new Date()).getTime();
        Logger.debug('Perf After finding races rows and current competition ' + (end - start) + 'ms');
        dto.races.map(race => race.split('/'));

        rows.forEach(row => {
            row.raceCode = dto.races
                .filter(race => race.split('/').indexOf(row.catev) >= 0)[0];
            Logger.debug('Saving Row ' + JSON.stringify(row));
            this.entityManager.save(row);
        });
        end = (new Date()).getTime();
        Logger.debug('Perf After saving all races rows ' + (end - start) + 'ms');
        competition.races = dto.races;
        await this.entityManager.save(competition);
    }

    @Post('/saveInfoGen')
    @ApiOperation({
        operationId: 'saveInfoGen',
        summary: 'Sauvegarde les informations générales d\'une épreuve (Speaker, Aboyeur, Commissaires,...)'
    })
    @ApiResponse({status: 200, isArray: false})
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async saveInfoGen(@Body() competitionToSave: CompetitionEntity): Promise<CompetitionEntity> {
        const competition = await this.repository.findOne(competitionToSave.id);
        if (!competition) throw new NotFoundException("Epreuve " + competitionToSave.name + " Introuvable")
        competition.feedback = competitionToSave.feedback;
        if (competition.competitionType === CompetitionType.CX) {
            competition.aboyeur = competitionToSave.aboyeur
        }
        competition.commissaires = competitionToSave.commissaires;
        competition.speaker = competitionToSave.speaker;
        competitionToSave.resultsValidated!=null && (competition.resultsValidated = competitionToSave.resultsValidated);
        return await this.entityManager.save(competition)
    }
}
