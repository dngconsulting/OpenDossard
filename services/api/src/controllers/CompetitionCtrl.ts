import {BadRequestException, Body, Controller, Get, Param, Post} from '@nestjs/common';
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
        description: 'Renvoie une épreuve'
    })
    public async get(@Param('id') id: string): Promise<Competition> {

        const r = await this.repository.find({where: {id}, relations: ['club']});

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
        description: 'Liste des épreuves totales'
    })
    @Get()
    public async getAllCompetitions(): Promise<Competition[]> {
        return this.repository.find();
    }

    @Post('/reorganize')
    @ApiOperation({
        operationId: 'reorganize',
        title: 'Réorganisation des courses',
    })
    @ApiResponse({status: 200, isArray: false})
    public async reorganize(@Body() dto: CompetitionReorganize): Promise<void> {

        const competition = await this.repository.findOne(dto.competitionId);

        if (!competition) {
            throw new BadRequestException(`Competition ${dto.competitionId} not found`);
        }

        dto.races = dto.races.filter(race => race.trim().length);

        const rows = await this.entityManager.find(Race, {where: {competitionId: dto.competitionId}});
        dto.races.map(race => race.split('/'));

        rows.forEach(row => {
            const raceCode = dto.races
                .filter(race => race.split('/').indexOf(row.catev) >= 0)[0];
            row.raceCode = raceCode;
            this.entityManager.save(row);
        });

        competition.races = dto.races;
        await this.entityManager.save(competition);
    }
}
