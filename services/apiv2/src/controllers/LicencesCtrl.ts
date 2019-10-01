import {Licence} from '../entity/Licence';
import {Repository} from 'typeorm';
import {Body, Controller, Get, Param, Put} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ApiUseTags} from '@nestjs/swagger';

/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */
@Controller('/api/licences')
@ApiUseTags('LicenceAPI')
export class LicencesCtrl {
    constructor(
        @InjectRepository(Licence)
        private readonly repository: Repository<Licence>,
    ) {
    }

    @Get(':id')
    public async get(@Param('id') id: string): Promise<Licence> {
        throw new Error('Not Implemented Yet');
    }

    @Get()
    public async getAllLicences(): Promise<Licence[]> {
        console.log('GET All licences ');
        return this.repository.find();
    }

    @Put('/')
    public async save(@Body('licence') licence: Licence)
        : Promise<Licence> {
        return licence;
    }
}
