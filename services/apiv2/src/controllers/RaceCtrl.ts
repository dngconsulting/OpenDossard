import {EntityManager, Transaction} from 'typeorm';

import {Race} from '../entity/Race';
import {Licence} from '../entity/Licence';
import {Competition} from '../entity/Competition';
import {ApiModelProperty, ApiUseTags} from '@nestjs/swagger';
import {Body, Controller, Get, Post, Put} from '@nestjs/common';
import {InjectEntityManager} from '@nestjs/typeorm';

export class RaceRow {
    @ApiModelProperty()
    public id: number;
    @ApiModelProperty()
    public raceCode: string;
    @ApiModelProperty()
    public riderNumber: number;
    @ApiModelProperty()
    public numberMin: number;
    @ApiModelProperty()
    public numberMax: number;
    @ApiModelProperty()
    public surclassed: boolean;
    @ApiModelProperty()
    public licenceNumber: string;
    @ApiModelProperty()
    public name: string;
    @ApiModelProperty()
    public firstName: string;
    @ApiModelProperty()
    public club: string;
    @ApiModelProperty()
    public birthYear: string;
}

export class RaceCreate {
    @ApiModelProperty()
    public competitionId: number;
    @ApiModelProperty()
    public licenceNumber: string;
    @ApiModelProperty()
    public riderNumber: number;
    @ApiModelProperty()
    public raceCode: string;
}

export class RaceUpdate {
    @ApiModelProperty()
    public id: number;
    @ApiModelProperty()
    public licenceNumber: string;
    @ApiModelProperty()
    public riderNumber: number;
    @ApiModelProperty()
    public raceCode: string;
}

@Controller('/api/races')
@ApiUseTags('RaceAPI')
export class RacesCtrl {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @Get()
    @Transaction()
    public async getAllRaces(): Promise<RaceRow[]> {

        const query = `select r.*, l.name, l."firstName", l."licenceNumber", l.club, l."birthYear"
                        from race r
                        join licence l on r."licenceId" = l.id`;
        return await this.entityManager.query(query);
    }

    @Post()
    public async create(@Body() race: RaceCreate)
        : Promise<void> {

        const licence = await this.entityManager.createQueryBuilder(Licence, 'licence')
            .where('licence."licenceNumber" = :ln', {ln: race.licenceNumber})
            .getOne();

        const competition = await this.entityManager.findOne(Competition, race.competitionId);

        const newRace = new Race();
        newRace.raceCode = race.raceCode;
        newRace.riderNumber = race.riderNumber;
        newRace.licence = licence;
        newRace.competition = competition;

        await this.entityManager.save(newRace);
    }

    @Put()
    public async update(@Body() race: RaceUpdate)
        : Promise<void> {

        const toUpdate = await this.entityManager.findOne(Race, race.id);
        toUpdate.riderNumber = race.riderNumber;
        toUpdate.raceCode = race.raceCode;
        await this.entityManager.save(toUpdate);
    }
}
