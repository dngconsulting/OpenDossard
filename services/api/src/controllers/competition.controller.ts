import {BadRequestException, Body, Controller, Get, Logger, Param, Post, UseGuards,} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {Any, Between, EntityManager, Repository} from 'typeorm';
import {CompetitionEntity} from '../entity/competition.entity';
import {RaceEntity} from '../entity/race.entity';
import {AuthGuard} from '@nestjs/passport';
import {CompetitionFilter, CompetitionReorganize} from '../dto/model.dto';
import * as moment from 'moment'

/**
 * Competition Controller handles all competitions operation ('Epreuve' in french)
 * The Reorganization method is when races are reorganized by categories
 */
@Controller('/api/competition')
@ApiTags('CompetitionAPI')
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

    @ApiOperation({
        operationId: 'getAllCompetitions',
        summary: 'Rechercher Toutes les compétitions ',
        description: 'Recherche toutes les compétitions disponibles',
    })
    @ApiResponse({
        status: 200,
        type: CompetitionEntity,
        isArray: true,
        description: 'Liste des épreuves totales',
    })
    @Get()
    public async getCompetitionsByFilter(competitionFilter : CompetitionFilter): Promise<CompetitionEntity[]> {
        let futureEventDate,pastEventDate;
        const competFilter = competitionFilter.competitionTypes ? {competitionType: Any(Array.from(competitionFilter.competitionTypes))}:null
        const fedeFilter=  competitionFilter.fedes? {fede: Any(Array.from(competitionFilter.fedes))}:null
        if (competitionFilter.displayPast && competitionFilter.displayPast===true) {
            pastEventDate=moment(new Date()).subtract(competitionFilter.displaySince,'d').toDate()
        } else {
            pastEventDate=new Date()
        }
        if (competitionFilter.displayFuture && competitionFilter.displayFuture===true) {
            futureEventDate=moment(new Date()).add(1,'y').toDate()
        } else {
            futureEventDate=new Date()
        }
        return await this.repository.find({
            where: {
                ...(competFilter),
                ...(fedeFilter),
                ...(competitionFilter.openedToOtherFede?{openedToOtherFede:competitionFilter.openedToOtherFede}:null),
                ...(competitionFilter.openedNL?{openedNL:competitionFilter.openedNL}:null),
                eventDate:Between(pastEventDate,
                    futureEventDate)
            },
            order: {
                eventDate: 'DESC',
            },
            relations: ['club'],
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('/reorganize')
    @ApiOperation({
        operationId: 'reorganize',
        summary: 'Réorganisation des courses',
    })
    @ApiResponse({status: 200, isArray: false})
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
}
