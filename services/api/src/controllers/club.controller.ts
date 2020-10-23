import {EntityManager, Repository} from 'typeorm';
import {BadRequestException, Body, Controller, Get, Param, Post, UseGuards} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ClubEntity} from '../entity/club.entity';
import {AuthGuard} from '@nestjs/passport';
import {ClubRow} from '../dto/model.dto';
import {ROLES, RolesGuard} from "../guards/roles.guard";
import {Roles} from "../decorators/roles.decorator";


@Controller('/api/clubs')
@ApiTags('ClubAPI')
@UseGuards(AuthGuard('jwt'),RolesGuard)
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
    @ApiOperation({
        operationId: 'getClubsByFede',
        summary: 'Rechercher tous les clubs de la federation en paramètre',
        description: 'Renvoie la liste des clubs de la federation en parametre',
    })
    @ApiResponse({status: 200, type: ClubRow, isArray: true, description: 'Liste des clubs'})
    @Get("byfede/:fede")
    public async getClubByFede(@Param('fede') fede:string): Promise<ClubRow[]> {
        return this.repository.find({where:{fede:fede}});
    }
    @ApiOperation({
        operationId: 'getClubsById',
        summary: 'Rechercher un club en fonction de son id',
        description: 'renvoie un club',
    })
    @ApiResponse({status: 200, type: ClubEntity, isArray:false, description: 'Club'})
    @Get(":id")
    public async getClubById(@Param('id') id:number): Promise<ClubEntity> {
        
        if (!id) {
            throw new BadRequestException(`Competition ${id} not found`);
        }
        return this.repository.findOne({id});
    }
    @Post()
    @ApiOperation({
        operationId: 'createClub',
        summary: 'Cree un nouveau club',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async create(@Body() newClub: ClubEntity): Promise<ClubEntity> {
        return this.repository.save(newClub)
    }

}
