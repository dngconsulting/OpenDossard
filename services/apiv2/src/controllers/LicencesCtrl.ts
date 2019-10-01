import {Licence} from '../entity/Licence';
import {EntityManager, getRepository, Repository, Transaction, TransactionManager} from 'typeorm';
import {Body, Controller, Get, Post, Put} from '@nestjs/common';
import {AppService} from '../services/app.service';
import {InjectRepository} from '@nestjs/typeorm';

/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */
@Controller('api')
export class LicencesCtrl {
    constructor(
        @InjectRepository(Licence)
        private readonly repository: Repository<Licence>,
    ) {}

    @Get(':id')
    public async get(id: string): Promise<Licence> {
        throw new Error('Not Implemented Yet');
    }

    @Get()
    public async getAllLicences(): Promise<Licence[]> {
        return this.repository.find();
    }

    @Post()
    public async getPageSizeLicencesForPage(@Body() currentPage: number,
                                            @Body() pageSize: number): Promise<Licence[]> {
        return await
            getRepository(Licence).createQueryBuilder()
                .skip(currentPage * pageSize)
                .take(pageSize)
                .getMany();
    }

    @Put('/')
    @Transaction()
    public async save(@Body() licence: Licence, @TransactionManager() em: EntityManager)
        : Promise<Licence> {
        await em.save(licence);
        return licence;
    }
}
