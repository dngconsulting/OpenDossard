import {Controller, Get, Param, BadRequestException} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {EntityManager, Repository} from 'typeorm';
import {Competition} from '../entity/Competition';

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
    @ApiResponse({status: 200, type: Competition, isArray: false, description: 'Renvoie une épreuve'})
    public async get(@Param('id') id: string): Promise<Competition> {

        const r = await this.repository.find({where: {id}, relations: ['club']});

        if ( r.length !== 1 ) {
            throw new BadRequestException(`Competition ${id} not found`);
        }

        return r[0];
    }

    @ApiOperation({
        operationId: 'getAllCompetitions',
        title: 'Rechercher Toutes les compétitions ',
        description: 'description',
    })
    @ApiResponse({status: 200, type: Competition, isArray: true, description: 'Liste des épreuves totales'})
    @Get()
    public async getAllCompetitions(): Promise<Competition[]> {
        return this.repository.find();
    }
}
