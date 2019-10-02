import {BodyParams, Controller, Delete, Get, PathParams, Post, Property, Put, Required} from '@tsed/common';
import {EntityManager, Transaction, TransactionManager} from 'typeorm';
import {Docs, ReturnsArray} from '@tsed/swagger';
import {Race} from '../entity/Race';
import {Licence} from '../entity/Licence';
import {Competition} from '../entity/Competition';
import {BadRequest} from 'ts-httpexceptions';

export class RaceRow {
    @Property()
    public id: number;
    @Property()
    public raceCode: string;
    @Property()
    public riderNumber: number;
    @Property()
    public numberMin: number;
    @Property()
    public numberMax: number;
    @Property()
    public surclassed: boolean;
    @Property()
    public licenceNumber: string;
    @Property()
    public name: string;
    @Property()
    public firstName: string;
    @Property()
    public club: string;
    @Property()
    public birthYear: string;
}

export class RaceCreate {
    @Property()
    public competitionId: number;
    @Property()
    public licenceNumber: string;
    @Property()
    public riderNumber: number;
    @Property()
    public raceCode: string;
}

export class RaceUpdate {
    @Property()
    public id: number;
    @Property()
    public licenceNumber: string;
    @Property()
    public riderNumber: number;
    @Property()
    public raceCode: string;
}

@Controller('/races')
@Docs('api-v2')
export class RacesCtrl {


    @Get('/')
    @ReturnsArray(RaceRow, {description: 'Liste des engagements'})
    @Transaction()
    public async getAllRaces(@TransactionManager() em: EntityManager): Promise<RaceRow[]> {

        const query = `select r.*, l.name, l."firstName", l."licenceNumber", l.club, l."birthYear"
                        from race r
                        join licence l on r."licenceId" = l.id`;
        return await em.query(query);
    }

    @Post('/')
    @Transaction()
    public async create(@BodyParams(RaceCreate) race: RaceCreate, @TransactionManager() em: EntityManager)
        : Promise<void> {

        const licence = await em.createQueryBuilder(Licence, 'licence')
            .where('licence."licenceNumber" = :ln', {ln: race.licenceNumber})
            .getOne();

        if ( ! licence ) {
            throw(new BadRequest('Licence inconnue'));
        }

        const competition = await em.findOne(Competition, race.competitionId);

        const newRace = new Race() ;
        newRace.raceCode = race.raceCode;
        newRace.riderNumber = race.riderNumber;
        newRace.licence = licence;
        newRace.competition = competition;

        await em.save(newRace);
    }

    @Put('/')
    @Transaction()
    public async update(@BodyParams(RaceUpdate) race: RaceUpdate, @TransactionManager() em: EntityManager)
        : Promise<void> {

        const toUpdate = await em.findOne(Race, race.id);
        toUpdate.riderNumber = race.riderNumber;
        toUpdate.raceCode = race.raceCode;
        await em.save(toUpdate);
    }

    @Delete('/:id')
    @Transaction()
    public async delete(@Required() @PathParams('id') id: string, @TransactionManager() em: EntityManager)
        : Promise<void> {

        em.delete(Race, id);
    }
}
