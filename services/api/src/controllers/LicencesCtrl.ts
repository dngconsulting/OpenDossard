import {BodyParams, Controller, Get, PathParams, Put, QueryParams, Required} from '@tsed/common';
import {NotFound} from 'ts-httpexceptions';
import {Licence} from '../entity/Licence';
import {EntityManager, getRepository, Transaction, TransactionManager} from 'typeorm';
import {Docs, ReturnsArray} from '@tsed/swagger';

/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */
@Controller('/licences')
@Docs('api-v2')
export class LicencesCtrl {

    @Get('/getLicencesLike')
    @Transaction()
    @ReturnsArray(Licence, {description: 'Liste des licences avec le nom, le prénom ou le numéro de licence répondant au critère'})
    public async getLicencesLike(@QueryParams('param') param: string,
                                 @TransactionManager() em: EntityManager): Promise<Licence> {
        const string = param + '%';
        const query: string = 'select l.* from licence l where UPPER(l.name) like $1 or UPPER(l."firstName") like $1 or UPPER(l."licenceNumber") like $1 fetch first 10 rows only';
        return await em.query(query, [string]);
    }

    @Get('/:id')
    public async get(@Required() @PathParams('id') id: string): Promise<Licence> {
        throw new NotFound('Not Implemented Yet');
    }

    @Get('/')
    @ReturnsArray(Licence, {description: 'Liste des licences'})
    public async getAllLicences(): Promise<Licence[]> {
        return getRepository(Licence).find();
    }

    @Put('/')
    @Transaction()
    public async save(@BodyParams(Licence) licence: Licence, @TransactionManager() em: EntityManager)
        : Promise<Licence> {
        await em.save(licence);
        return licence;
    }
}
