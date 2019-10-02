import {Licence} from '../entity/Licence';
import {EntityManager, Repository} from 'typeorm';
import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {Filter, LicencesPage, Search} from './SharedModels';

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
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @Get(':id')
    @ApiOperation({
        operationId: 'get',
        title: 'Rechercher une licence par ID ',
        description: 'description',
    })
    public async get(@Param('id') id: string): Promise<Licence> {
        throw new Error('Not Implemented Yet');
    }

    @ApiOperation({
        operationId: 'getAllLicences',
        title: 'Rechercher toutes les licences ',
        description: 'description',
    })
    @ApiResponse({status: 200, type: Licence, isArray: true, description: 'Liste des licences'})
    @Get()
    public async getAllLicences(): Promise<Licence[]> {
        return this.repository.find();
    }

    @ApiOperation({
        operationId: 'getPageSizeLicencesForPage',
        title: 'Rechercher par page les licences ',
        description: 'currentPage, pageSize, orderDirection, orderBy et Filters',
    })
    @Post('/search')
    @ApiResponse({status: 200, type: LicencesPage})
    public async getPageSizeLicencesForPage(@Body() search: Search): Promise<LicencesPage> {
        const qb = this.repository.createQueryBuilder();
        search.filters.forEach((filter: Filter) => {
            qb.andWhere(`"${filter.name}"` + ' ilike :' + filter.name, {[filter.name]: '%' + filter.value + '%'});
        });
        if (typeof search.orderBy !== 'undefined') {
            qb.orderBy(`"${search.orderBy}"`, search.orderDirection);
        }
        const res = await
            qb
                .skip(search.currentPage * search.pageSize)
                .take(search.pageSize)
                .getManyAndCount();
        return {data: res[0], page: search.currentPage, totalCount: res[1]};
    }

    @Put('/')
    @ApiOperation({
        operationId: 'save',
        title: 'Modifie une licence existante ',
        description: 'description',
    })
    public async save(@Body() licence: Licence)
        : Promise<Licence> {
        return this.entityManager.save(licence);
    }

    @Put('/update')
    @ApiOperation({
        title: 'update une licence existante',
        operationId: 'update',
    })
    public async update(@Body() licence: Licence)
        : Promise<void> {
        const toUpdate = await this.entityManager.findOne(Licence, licence.id);
        toUpdate.licenceNumber = licence.licenceNumber;
        toUpdate.birthYear = licence.birthYear;
        toUpdate.name = licence.name;
        toUpdate.firstName = licence.firstName;
        toUpdate.gender = licence.gender;
        toUpdate.dept = licence.dept;
        toUpdate.catea = licence.catea;
        toUpdate.catev = licence.catev;
        await this.entityManager.save(toUpdate);
    }

    @Delete('/:id')
    @ApiOperation({
        title: 'delete licence',
        operationId: 'delete',
    })
    public async delete(@Param('id') id: string)
        : Promise<void> {
        await this.entityManager.delete(Licence, id);
    }
}
