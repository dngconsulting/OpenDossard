import {BadRequestException, Body, Controller, Get, Logger, Param, Post,} from '@nestjs/common';
import {ApiModelPropertyOptional, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {EntityManager, Repository} from 'typeorm';
import {Competition} from '../entity/Competition';
import {Race} from '../entity/Race';

export class CompetitionReorganize {
    @ApiModelPropertyOptional()
    public competitionId: number;
    @ApiModelPropertyOptional()
    public races: string[];
}

/**
 * Competition Controller handles all competitions operation ('Epreuve' in french)
 * The Reorganization method is where races are reorganized by categories
 *
 */
@Controller('/api/competition')
@ApiUseTags('CompetitionAPI')
export class CompetitionCtrl {
    constructor(
        @InjectRepository(Competition)
        private readonly repository: Repository<Competition>,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @Get(':id')
    @ApiOperation({
        operationId: 'get',
        title: 'Recherche d\'une épreuve par ID ',
        description: 'description',
    })
    @ApiResponse({
        status: 200,
        type: Competition,
        isArray: false,
        description: 'Renvoie une épreuve',
    })
    public async get(@Param('id') id: string): Promise<Competition> {
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
        title: 'Rechercher Toutes les compétitions ',
        description: 'description',
    })
    @ApiResponse({
        status: 200,
        type: Competition,
        isArray: true,
        description: 'Liste des épreuves totales',
    })
    @Get()
    public async getAllCompetitions(): Promise<Competition[]> {
        return await this.repository.find({
            order: {
                eventDate: 'ASC',
            }, relations: ['club']
        });
    }

    @Post('/reorganize')
    @ApiOperation({
        operationId: 'reorganize',
        title: 'Réorganisation des courses',
    })
    @ApiResponse({status: 200, isArray: false})
    public async reorganize(@Body() dto: CompetitionReorganize): Promise<void> {
        const start = (new Date()).getTime();
        const competition = await this.repository.findOne(dto.competitionId);
        if (!competition) {
            throw new BadRequestException(`Competition ${dto.competitionId} not found`);
        }
        dto.races = dto.races.filter(race => race.trim().length);

        const rows = await this.entityManager.find<Race>(Race, {competition: {id: dto.competitionId}});
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
