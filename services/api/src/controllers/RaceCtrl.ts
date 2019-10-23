import {EntityManager} from 'typeorm';

import {Race} from '../entity/Race';
import {Licence} from '../entity/Licence';
import {Competition} from '../entity/Competition';
import {
    ApiImplicitBody,
    ApiModelProperty,
    ApiModelPropertyOptional,
    ApiOperation,
    ApiResponse,
    ApiUseTags,
} from '@nestjs/swagger';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Logger,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import {InjectEntityManager} from '@nestjs/typeorm';

import * as _ from 'lodash';

export class RaceRow {
    @ApiModelPropertyOptional()
    public id: number;
    @ApiModelPropertyOptional()
    public raceCode: string;
    @ApiModelPropertyOptional()
    public riderNumber: number;
    @ApiModelPropertyOptional()
    public surclassed: boolean;
    @ApiModelPropertyOptional()
    public licenceNumber: string;
    @ApiModelPropertyOptional()
    public name: string;
    @ApiModelPropertyOptional()
    public club: string;
    @ApiModelPropertyOptional()
    public catev: string;
    @ApiModelPropertyOptional()
    public catea: string;
    @ApiModelPropertyOptional()
    public fede: string;
    @ApiModelPropertyOptional()
    public gender: string;
    @ApiModelPropertyOptional()
    public rankingScratch: number;
    @ApiModelPropertyOptional()
    public comment: string;
    @ApiModelProperty()
    public competitionId: number;
}

export class RaceCreate {
    @ApiModelPropertyOptional()
    public competitionId: number;
    @ApiModelPropertyOptional()
    public licenceId: number;
    @ApiModelPropertyOptional()
    public riderNumber: number;
    @ApiModelPropertyOptional()
    public raceCode: string;
    @ApiModelPropertyOptional()
    public catev: string;
}

export class RaceNbRider {
    @ApiModelPropertyOptional()
    public count: number;
    @ApiModelPropertyOptional()
    public raceCode: string;
    @ApiModelPropertyOptional()
    public name: string;
    @ApiModelPropertyOptional({type: 'string', format: 'date-time'})
    public date: Date;
    @ApiModelPropertyOptional()
    public fede: string;
}

/***
 * Races Controller manages races inside Competitions
 * Races a generally organized by categories
 */
@Controller('/api/races')
@ApiUseTags('RaceAPI')
export class RacesCtrl {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @Get('/nbRider')
    @ApiOperation({
        operationId: 'getNumberRider',
        title: 'Rechercher le nombre de coureur par course ',
        description: 'description',
    })
    @ApiResponse({status: 200, type: RaceNbRider, isArray: true})
    public async getNumberRider(): Promise<RaceNbRider[]> {
        const query = `select count(r.*), c.name, r."raceCode", c."eventDate", c.fede
                        from race r
                        join competition c on r."competitionId" = c.id
                        group by r."competitionId", c.name, r."raceCode", c."eventDate", c.fede`;
        return await this.entityManager.query(query);
    }

    @Get('/:id')
    @ApiOperation({
        operationId: 'getCompetitionRaces',
        title: 'Rechercher tous les coureurs participants à une course ',
        description: 'description',
    })
    @ApiResponse({status: 200, type: RaceRow, isArray: true})
    public async getCompetitionRaces(@Param('id') competitionId: number): Promise<RaceRow[]> {

        const query = `select r.*, concat(l.name,' ',l."firstName") as name, l."licenceNumber", l.club, l.gender
                        from race r
                        join licence l on r."licenceId" = l.id
                        where r."competitionId" = $1
                        order by r.id desc`;
        return await this.entityManager.query(query, [competitionId]);
    }

    @Post()
    @ApiOperation({
        operationId: 'create',
        title: 'Cree une nouvelle course ',
        description: 'description',
    })
    public async create(@Body() race: RaceCreate)
        : Promise<void> {

        if (!race.licenceId) {
            throw(new BadRequestException('Veuillez renseigner un coureur'));
        }

        if (!race.riderNumber) {
            throw(new BadRequestException('Veuillez renseigner un numéro de dossard'));
        }

        if (!race.catev) {
            throw(new BadRequestException('Veuillez renseigner la catégorie dans laquelle le coureur participe'));
        }

        const licence = await this.entityManager.findOne(Licence, race.licenceId);

        if (!licence) {
            throw(new BadRequestException('Licence inconnue'));
        }

        const numberConflict = await this.entityManager.createQueryBuilder(Race, 'race')
            .where('race."competitionId" = :cid and race."riderNumber" = :riderNumber', {
                cid: race.competitionId,
                riderNumber: race.riderNumber,
            })
            .getOne();

        if (numberConflict) {
            throw(new BadRequestException(`Le numéro de dossard ${race.riderNumber} est déjà pris`));
        }

        const licenceConflict = await this.entityManager.createQueryBuilder(Race, 'race')
            .where('race."competitionId" = :cid and race."licenceId" = :licenceId', {
                cid: race.competitionId,
                licenceId: licence.id,
            })
            .getOne();

        if (licenceConflict) {
            throw(new BadRequestException(`Ce licencié est déjà inscrit sur cette épreuve`));
        }

        const competition = await this.entityManager.findOne(Competition, race.competitionId);

        const newRace = new Race();
        newRace.raceCode = race.raceCode;
        newRace.riderNumber = race.riderNumber;
        newRace.licence = licence;
        newRace.competition = competition;
        newRace.catev = race.catev;

        await this.entityManager.save(newRace);
    }

    @Put('/reorderRank')
    @ApiOperation({
        title: 'Réordonne le classement',
        operationId: 'reorderRanking',
    })
    @ApiImplicitBody({name: 'body', type: [RaceRow]})
    public async reorderRanking(@Body() racesrows: RaceRow[]): Promise<void> {
        // Lets remove non ranked riders and DSQ/ABD
        const rows = _.remove(racesrows, item => item.id && !item.comment);
        for (let index = 1; index <= rows.length; index++) {
            const item = rows[index - 1];
            const raceRowToSave: Race = await this.entityManager.findOne(Race, {id: item.id});
            if (raceRowToSave.rankingScratch !== index && !raceRowToSave.comment) {
                raceRowToSave.rankingScratch = index;
                Logger.debug('Update Ranking of rider number ' + raceRowToSave.riderNumber + ' with rank ' + (index));
                await this.entityManager.save(raceRowToSave);
            }
        }
    }

    @Put('/removeRanking')
    @ApiOperation({
        title: 'Supprime un coureur du classement',
        operationId: 'removeRanking',
    })
    public async removeRanking(@Body() raceRow: RaceRow): Promise<void> {
        Logger.debug('RemoveRanking with raceRow=' + JSON.stringify(raceRow));
        const racerowToUpdate = await this.entityManager.findOne<Race>(Race, {
            id: raceRow.id,
        });
        if (!racerowToUpdate) {
            return;
        }
        // If he is ABD/DSQ, remove the comment, otherwise remove the rank
        if (racerowToUpdate.comment) {
            racerowToUpdate.comment = null;
        } else {
            Logger.debug('Remove Ranking for rider number ' + racerowToUpdate.riderNumber);
            racerowToUpdate.rankingScratch = null;
        }
        await this.entityManager.save(racerowToUpdate);

        // Retrieve all ranks for this race ...
        const races = await this.entityManager.find(Race, {
            raceCode: raceRow.raceCode,
            competition: {id: raceRow.competitionId},
        });
        const existingRankedRaces = _.orderBy(races, ['rankingScratch'], ['asc']);
        // ... And  reorder them because of potential "holes" after deleting
        for (let index = 1; index <= existingRankedRaces.length; index++) {
            const item = existingRankedRaces[index - 1];
            if (item.rankingScratch && item.rankingScratch !== index && !item.comment) {
                item.rankingScratch = index;
                Logger.debug('Update Ranking of rider number ' + item.riderNumber + ' with rank ' + (index));
                await this.entityManager.save(item);
            }
        }
    }

    @Put('/update')
    @ApiOperation({
        title: 'Met à jour le classement du coureur ',
        operationId: 'update',
    })
    public async updateRanking(@Body() raceRow: RaceRow)
        : Promise<void> {
        Logger.debug('Update Rank for rider ' + JSON.stringify(raceRow));
        // Lets find first the corresponding Race row rider
        const requestedRankedRider = await this.entityManager.findOne<Race>(Race, {
            riderNumber: raceRow.riderNumber,
            raceCode: raceRow.raceCode,
            competition: {id: raceRow.competitionId},
        });
        if (!requestedRankedRider) {
            Logger.warn('Impossible de classer ce coureur, ' + JSON.stringify(requestedRankedRider) + ' il n\'existe pas');
            throw(new BadRequestException('Impossible de classer ce coureur, il n\'existe pas en base de données'));
        }

        // Check if this rider has already a rank or is ABD
        if (requestedRankedRider.rankingScratch || requestedRankedRider.comment) {
            Logger.warn('Impossible de classer ce coureur, ' + JSON.stringify(requestedRankedRider) + ' il existe déjà dans le classement');
            throw(new BadRequestException('Impossible de classer le coureur au dossard ' + requestedRankedRider.riderNumber + ' il existe déjà dans le classement'));
        }
        // Check if there is existing rider with this rank in this race with the same dossard
        const rankRiderToChange = await this.entityManager.findOne(Race, {
            rankingScratch: raceRow.rankingScratch,
            raceCode: raceRow.raceCode,
            competition: {id: raceRow.competitionId},
        });
        // If a rider already exist, it depends on the existing ranking
        // if the ranking is the one we want to change, its and edit, no problem, we remove him
        if (rankRiderToChange) {
            Logger.debug('A rider exist with this rank ' + JSON.stringify(rankRiderToChange.rankingScratch)
                + ' New Rank to update =' + raceRow.rankingScratch);
            if (rankRiderToChange.rankingScratch === raceRow.rankingScratch) {
                Logger.debug('Existing rider will be removed from ranking ' + JSON.stringify(rankRiderToChange));
                rankRiderToChange.rankingScratch = null;
                rankRiderToChange.comment = null;
                await this.entityManager.save(rankRiderToChange);
            }
        }
        requestedRankedRider.rankingScratch = raceRow.rankingScratch;
        requestedRankedRider.comment = raceRow.comment;
        await this.entityManager.save(requestedRankedRider);
    }

    @Delete('/:id')
    @ApiOperation({
        title: 'delete race',
        operationId: 'delete',
    })
    public async delete(@Param('id') id: string)
        : Promise<void> {

        this.entityManager.delete(Race, id);
    }
}
