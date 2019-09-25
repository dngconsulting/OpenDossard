import {BodyParams, Controller, Get, PathParams, Put, Required} from '@tsed/common';
import {NotFound} from 'ts-httpexceptions';
import {Licence} from '../entity/Licence';
import {getConnection} from '../util/LazyConnection';

/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */
@Controller('/licences')
export class LicencesCtrl {

    @Get('/:id')
    public async get(@Required() @PathParams('id') id: string): Promise<Licence> {
        throw new NotFound('Not Implemented Yet');
    }

    @Get('/')
    public async getAllLicences(): Promise<Licence[]> {
        const connection = await getConnection();
        return await connection.getRepository(Licence).find();
    }

    @Put('/')
    public async save(@BodyParams('licenceNumber')licenceId: string,
                      @BodyParams('nom') nom: string,
                      @BodyParams('prenom') prenom: string,
                      @BodyParams('genre') sexe: string): Promise<Licence> {

        const connection = await getConnection();
        return await connection.transaction<Licence>(async t => {
            const licence = new Licence();
            licence.nom = nom;
            licence.prenom = prenom;
            licence.genre = sexe;
            await t.save(licence);
            return licence;
        });
    }
}
