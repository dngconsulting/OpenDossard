import {BodyParams, Controller, Get, PathParams, Put, Required} from '@tsed/common';
import {NotFound} from 'ts-httpexceptions';
import {Licence} from '../entity/Licence';
import {Event} from '../interfaces/Event';
import {createConnection} from 'typeorm';

/**
 * Add @Controller annotation to declare your class as Router controller.
 * The first param is the global path for your controller.
 * The others params is the controller dependencies.
 *
 * In this case, EventsCtrl is a dependency of CalendarsCtrl.
 * All routes of EventsCtrl will be mounted on the `/calendars` path.
 */
@Controller("/licences")
export class LicencesCtrl {
    private licences = require("../../resources/licences.json")
    @Get("/:id")
    async get(@Required() @PathParams("id") id: string): Promise<Licence> {
        throw new NotFound("Not Implemented Yet");
    }

    @Get("/")
    async getAllLicences(): Promise<Licence[]> {

        createConnection().then(async connection => {
            console.log("Inserting a new user into the database...");
            this.licences.forEach(async function (licence, index) {
                console.log("licence " + JSON.stringify(licence))
                const licenceToI = new Licence();
                licenceToI.nom = licence.NOM;
                licenceToI.prenom = licence.PRENOM;
                licenceToI.genre = licence.GENRE;
                licenceToI.club = licence.CLUB;
                licenceToI.dept = licence.DEPT
                licenceToI.catev = licence.CATEV
                licenceToI.catea = licence.CATEA
                licenceToI.age = licence.AGE
                await connection.manager.save(licenceToI);
            });



        }).catch(error => console.log(error));
        return null;
        /*createConnection().then(async connection => {
        return await connection.getRepository(Licence).find();
        }).catch(error => console.log(error));
        return null*/
    }

    @Put("/")
    async save(@BodyParams("licenceNumber")licenceId: string,
               @BodyParams("nom") nom: string,
               @BodyParams("prenom") prenom: string,
               @BodyParams("genre") sexe: string): Promise<Licence> {
        const licence = new Licence();
        createConnection().then(async connection => {
            console.log("Inserting a new user into the database...");
            licence.nom = "RUBY";
            licence.prenom = "Jérome";
            licence.genre = "H";
            await connection.manager.save(licence);
            console.log("Saved a new licence with id: " + licence.id);

        }).catch(error => console.log(error));

      return licence
    }
}
