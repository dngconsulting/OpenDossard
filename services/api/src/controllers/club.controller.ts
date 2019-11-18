import {EntityManager, Repository} from 'typeorm';
import {Controller, Get, UseGuards} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiModelPropertyOptional, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {ClubEntity} from '../entity/club.entity';
import {AuthGuard} from '@nestjs/passport';

export class ClubRow {
    @ApiModelPropertyOptional()
    public id: number;
    @ApiModelPropertyOptional()
    public longName: string;
    @ApiModelPropertyOptional()
    public dept: string;
    @ApiModelPropertyOptional()
    public shortName: string;
}

@Controller('/api/clubs')
@ApiUseTags('ClubAPI')
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
        title: 'Rechercher tous les clubs',
        description: 'description',
    })
    @ApiResponse({status: 200, type: ClubRow, isArray: true, description: 'Liste des clubs'})
    @Get()
    public async getAllClubs(): Promise<ClubRow[]> {
        return this.repository.find();
    }

}
