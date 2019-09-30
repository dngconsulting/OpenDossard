import {Controller, Get, Property} from '@tsed/common';
import {EntityManager, Transaction, TransactionManager} from 'typeorm';
import {Docs, ReturnsArray} from '@tsed/swagger';

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
}

@Controller('/races')
@Docs('api-v2')
export class RacesCtrl {


    @Get('/')
    @ReturnsArray(RaceRow, {description: 'Liste des engagements'})
    @Transaction()
    public async getAllRaces(@TransactionManager() em: EntityManager): Promise<RaceRow[]> {

        const query = `select r.*, l.name, l."firstName", l."licenceNumber"
                        from race r
                        join licence l on r."licenceId" = l.id`;
        return await em.query(query);
    }

}
