import {EntityManager, Repository} from 'typeorm';
import {Controller, Get, UseGuards} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ClubEntity} from '../entity/club.entity';
import {AuthGuard} from '@nestjs/passport';
import {ClubRow} from '../dto/model.dto';


@Controller('/api/clubs')
@ApiTags('ClubAPI')
@UseGuards(AuthGuard('jwt'))
export class ClubController {
    constructor(
        @InjectRepository(ClubEntity)
        private readonly repository: Repository<ClubEntity>,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @ApiOperation({
        operationId: 'getAllClubs',
        summary: 'Rechercher tous les clubs',
        description: 'Renvoie la liste de tous les clubs',
    })
    @ApiResponse({status: 200, type: ClubRow, isArray: true, description: 'Liste des clubs'})
    @Get()
    public async getAllClubs(): Promise<ClubRow[]> {
        return this.repository.find();
    }

}
