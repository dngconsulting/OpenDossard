import {Licence} from '../entity/Licence';
import {EntityManager, Repository} from 'typeorm';
import {Controller, Get} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {Club} from '../entity/Club';

/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */
@Controller('/api/clubs')
@ApiUseTags('ClubAPI')
export class ClubCtrl {
    constructor(
        @InjectRepository(Club)
        private readonly repository: Repository<Club>,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @ApiOperation({
        operationId: 'getAllClubs',
        title: 'Rechercher tous les clubs',
        description: 'description',
    })
    @ApiResponse({status: 200, type: Club, isArray: true, description: 'Liste des clubs'})
    @Get()
    public async getAllClubs(): Promise<Club[]> {
        return this.repository.find();
    }

}
