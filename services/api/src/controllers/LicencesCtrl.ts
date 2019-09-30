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

    @Post('/')
    @Returns(LicencesPage, {description: 'Liste des licences with pagination'})
    public async getPageSizeLicencesForPage(@BodyParams('currentPage') currentPage: number,
                                            @BodyParams('pageSize') pageSize: number,
                                            @BodyParams('orderDirection') orderDirection?: 'ASC'|'DESC',
                                            @BodyParams('orderBy') orderBy?: string): Promise<LicencesPage> {
        const res = await
            getRepository(Licence).createQueryBuilder()
                .skip(currentPage * pageSize)
                .take(pageSize)
                .orderBy(`"${orderBy}"`, orderDirection)
                .getMany();
        const total = await getRepository(Licence).createQueryBuilder('licence').getCount();
        return {data: res, page: currentPage, totalCount: total};
    }

    @Put('/')
    @Transaction()
    public async save(@BodyParams(Licence) licence: Licence, @TransactionManager() em: EntityManager)
        : Promise<Licence> {
        await em.save(licence);
        return licence;
    }
}
