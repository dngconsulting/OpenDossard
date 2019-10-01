import {Licence} from '../entity/Licence';
import {EntityManager, Repository} from 'typeorm';
import {Body, Controller, Get, Param, Post, Put} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiModelProperty, ApiOperation, ApiUseTags} from '@nestjs/swagger';


/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */

class LicencesPage {
    @ApiModelProperty()
    data: Licence[];
    @ApiModelProperty()
    page: number;
    @ApiModelProperty()
    totalCount: number;
}

interface IFilter {
    name: string;
    value: string;
}

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
    @ApiOperation({ title: 'Rechercher une licence par ID ' })
    public async get(@Param('id') id: string): Promise<Licence> {
        throw new Error('Not Implemented Yet');
    }

    @ApiOperation({ title: 'Rechercher toutes les licences ' })
    @Get()
    public async getAllLicences(): Promise<Licence[]> {
        return this.repository.find();
    }

    @ApiOperation({ title: 'Rechercher par page les licences ', description : 'currentPage, pageSize, orderDirection, orderBy et Filters' })
    @Post()
    public async getPageSizeLicencesForPage(@Body() currentPage: number,
                                            @Body() pageSize: number,
                                            @Body() orderDirection?: 'ASC' | 'DESC',
                                            @Body() orderBy?: string,
                                            @Body() filters?: IFilter[]): Promise<LicencesPage> {
        const qb = this.repository.createQueryBuilder();
        filters.forEach((filter: IFilter) => {
            qb.andWhere(`"${filter.name}"` + ' ilike :' + filter.name, {[filter.name]: '%' + filter.value + '%'});
        });
        if (typeof orderBy !== 'undefined') {
            qb.orderBy(`"${orderBy}"`, orderDirection);
        }
        const res = await
            qb
                .skip(currentPage * pageSize)
                .take(pageSize)
                .getManyAndCount();
        return {data: res[0], page: currentPage, totalCount: res[1]};
    }

    @Put('/')
    @ApiOperation({ title: 'Modifie une licence existante '})
    public async save(@Body() licence: Licence)
        : Promise<Licence> {
        return this.entityManager.save(licence);
    }
}
