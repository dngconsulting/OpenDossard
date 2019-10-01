import {BodyParams, Controller, Get, PathParams, Post, Property, Put, Required} from '@tsed/common';
import {NotFound} from 'ts-httpexceptions';
import {Licence} from '../entity/Licence';
import {EntityManager, getRepository, Transaction, TransactionManager} from 'typeorm';
import {Docs, Returns, ReturnsArray} from '@tsed/swagger';

/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */
class LicencesPage {
    @Property()
    data: Licence[];
    @Property()
    page: number;
    @Property()
    totalCount: number;
}

class IFilter {
    @Property()
    name: string;
    @Property()
    value: string;
}

class ISearch {
    @Property()
    currentPage: number;
    @Property()
    pageSize: number;
    @Property()
    orderDirection?: 'ASC'|'DESC';
    @Property()
    orderBy?: string;
    @Property()
    filters?: IFilter[];
}

@Controller('/licences')
@Docs('api-v2')
export class LicencesCtrl {

    @Get('/:id')
    public async get(@Required() @PathParams('id') id: string): Promise<Licence> {
        throw new NotFound('Not Implemented Yet');
    }

    @Get('/')
    @ReturnsArray(Licence, {description: 'Liste des licences'})
    public async getAllLicences(): Promise<Licence[]> {
        return getRepository(Licence).find();
    }

    @Post('/search')
    @Returns(LicencesPage, {description: 'Liste des licences with pagination'})
    public async getPageSizeLicencesForPage(@BodyParams(ISearch) {currentPage, pageSize,
        filters, orderBy, orderDirection}: ISearch): Promise<LicencesPage> {
        const qb = getRepository(Licence).createQueryBuilder();
        filters.forEach((filter: IFilter) => {
               qb.andWhere(`"${filter.name}"` + ' ilike :' + filter.name , { [filter.name]: '%' + filter.value + '%' });
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
    @Transaction()
    public async save(@BodyParams(Licence) licence: Licence, @TransactionManager() em: EntityManager)
        : Promise<Licence> {
        await em.save(licence);
        return licence;
    }
}
