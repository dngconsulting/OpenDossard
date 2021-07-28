import {EntityManager} from 'typeorm';

import {RaceEntity} from '../entity/race.entity';
import {LicenceEntity} from '../entity/licence.entity';
import {CompetitionEntity, CompetitionType} from '../entity/competition.entity';
import {ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {BadRequestException, Body, Controller, Delete, Get, Logger, Param, Post, Put, UseGuards,} from '@nestjs/common';
import {InjectEntityManager} from '@nestjs/typeorm';
import * as _ from 'lodash';
import {AuthGuard} from '@nestjs/passport';
import {CompetitionFilter, RaceCreate, RaceNbRider, RaceRow} from '../dto/model.dto';
import {ROLES, RolesGuard} from "../guards/roles.guard";
import {Roles} from "../decorators/roles.decorator";

/***
 * Races Controller manages races inside Competitions
 * Races a generally organized by category
 */
@Controller('/api/races')
@ApiTags('RaceAPI')
@UseGuards(AuthGuard('jwt'),RolesGuard)
export class RacesCtrl {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @Get('/nbRider')
    @ApiOperation({
        operationId: 'getNumberRider',
        summary: 'Rechercher le nombre de coureur par course ',
    })
    @ApiResponse({status: 200, type: RaceNbRider, isArray: true})
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async getNumberRider(): Promise<RaceNbRider[]> {
        return null;
    }

    @Post("/getRaces")
    @ApiOperation({
        operationId: 'getRaces',
        summary: 'Rechercher les participations aux courses de MM/JJ/AAAA à MM/JJ/AAAA',
    })
    @ApiResponse({status: 200, type: RaceRow, isArray: true})
    @Roles(ROLES.MOBILE,ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async getRaces(@Body() filter:CompetitionFilter ): Promise<RaceRow[]> {
        const parameters = []
        let endDate="";
        if (filter.startDate==null || filter.startDate==='') filter.startDate='01/01/2018';
        parameters.push(filter.startDate)
        if (filter.endDate) {
            endDate = " and c.event_date<$2"
            parameters.push(filter.endDate)
        }

        const query = `select r.id,
                              r.race_code as "raceCode",
                              r.catev,                             
                              r.rider_dossard as "riderNumber",
                              r.ranking_scratch as "rankingScratch",
                              r.number_min as "numberMin",
                              r.number_max as "numberMax",
                              r.licence_id as "licenceId",
                              r.sprintchallenge,
                              r.comment,
                              r.competition_id as "competitionId",
                              concat(l.name, ' ', l.first_name) as "riderName",
                              l.licence_number,
                              r.club,
                              l.gender,
                              l.fede,
                              l.birth_year,
                              r.catea,
                              c.name,
                              c.event_date
                       from race r
                                join licence l on r.licence_id = l.id
                                join competition c on r.competition_id = c.id
                       where c.event_date>$1 ${endDate} order by r.id desc `;
        return await this.entityManager.query(query,parameters);
    }

    @Get('palmares/:id')
    @ApiOperation({
        operationId: 'getPalmares',
        summary: 'Rechercher le palmares d\'un coureur par son id coureur',
    })
    @ApiResponse({status: 200, type: RaceRow, isArray: true})
    public async getPalmares(@Param('id') licenceId: number): Promise<RaceRow[]> {
        const query = `select r.id,
                              r.race_code as "raceCode",
                              r.catev,                             
                              r.rider_dossard as "riderNumber",
                              r.ranking_scratch as "rankingScratch",
                              r.number_min as "numberMin",
                              r.number_max as "numberMax",
                              r.licence_id as "licenceId",
                              r.sprintchallenge,
                              r.comment,
                              r.competition_id as "competitionId",
                              concat(l.name, ' ', l.first_name) as "riderName",
                              c.name,
                              c.event_date  as "competitionDate",
                              c.competition_type as "competitionType",
                              c.races as "competitionRaces",
                              l.licence_number as "licenceNumber",
                              r.club,
                              l.gender,
                              c.fede,
                              l.birth_year as "birthYear",
                              r.catea
                       from race r
                                join licence l on r.licence_id = l.id
                                join competition c on r.competition_id = c.id
                       where r.licence_id = $1
                       order by r.id desc`;
        return await this.entityManager.query(query, [licenceId]);
    }


    @Get('/:id')
    @ApiOperation({
        operationId: 'getCompetitionRaces',
        summary: 'Rechercher tous les coureurs participants à une course ',
    })
    @ApiResponse({status: 200, type: RaceRow, isArray: true})
    @Roles(ROLES.MOBILE,ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async getCompetitionRaces(@Param('id') competitionId: number): Promise<RaceRow[]> {

        const query = `select r.id,
                              r.race_code as "raceCode",
                              r.catev,                             
                              r.rider_dossard as "riderNumber",
                              r.ranking_scratch as "rankingScratch",
                              r.number_min as "numberMin",
                              r.number_max as "numberMax",
                              r.licence_id as "licenceId",
                              r.sprintchallenge,
                              r.comment,
                              r.competition_id as "competitionId",
                              concat(l.name, ' ', l.first_name) as name,
                              l.licence_number as "licenceNumber",
                              r.catea,
                              l.dept,
                              r.club,
                              l.gender,
                              l.fede,
                              l.birth_year as "birthYear"
                       from race r
                                join licence l on r.licence_id = l.id
                       where r.competition_id = $1
                       order by r.id desc`;
        return await this.entityManager.query(query, [competitionId]);
    }

    @Post()
    @ApiOperation({
        operationId: 'engage',
        summary: 'Engage un nouveau coureur ',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
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

        const licence = await this.entityManager.findOne(LicenceEntity, race.licenceId);

        if (!licence) {
            throw(new BadRequestException('Licence inconnue'));
        }

        const numberConflict = await this.entityManager.createQueryBuilder(RaceEntity, 'race')
            .where('race.competition_id = :cid and race.rider_dossard = :riderNumber and race.race_code= :raceCode', {
                cid: race.competitionId,
                riderNumber: race.riderNumber,
                raceCode: race.raceCode,
            })
            .getOne();

        if (numberConflict) {
            throw(new BadRequestException(`Le numéro de dossard ${race.riderNumber} est déjà pris`));
        }

        const licenceConflict = await this.entityManager.createQueryBuilder(RaceEntity, 'race')
            .where('race.competition_id = :cid and race.licence_id = :licenceId and race.race_code= :raceCode', {
                cid: race.competitionId,
                licenceId: licence.id,
                raceCode:race.raceCode
            })
            .getOne();

        if (licenceConflict) {
            throw(new BadRequestException(`Ce licencié est déjà inscrit sur cette épreuve`));
        }

        const competition = await this.entityManager.findOne(CompetitionEntity, race.competitionId);

        const newRace = new RaceEntity();
        newRace.raceCode = race.raceCode;
        newRace.riderNumber = race.riderNumber;
        newRace.licence = licence;
        newRace.competition = competition;
        newRace.catev = race.catev;
        newRace.catea = race.catea;
        newRace.club = race.club;
        if (race.rankingScratch) { newRace.rankingScratch = race.rankingScratch; }

        await this.entityManager.save(newRace);
    }

    @Post('/refreshEngagement/:licenceId/:competitionId')
    @ApiOperation({
        operationId: 'refreshEngagement',
        summary: 'Met à jour l\'engagement du coureur licenceId sur la competition competitionId',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async refreshEngagement(@Param('competitionId') competitionId: number,@Param('licenceId') licenceId: number)
        : Promise<void> {
        Logger.debug('[RefreshEngagement] licenceId =' + licenceId + ' competitionId=' + competitionId)
        const licence = await this.entityManager.findOne<LicenceEntity>(LicenceEntity, {
            id: licenceId,
        });
        const racerowToUpdate = await this.entityManager.findOne<RaceEntity>(RaceEntity, {
            where : {
                competition: {id:competitionId},
                licence: {id:licenceId}
            },
            relations: ['competition']
        });
        racerowToUpdate.club = licence.club;
        racerowToUpdate.catea = licence.catea;
        racerowToUpdate.catev = (racerowToUpdate.competition.competitionType === CompetitionType.CX?licence.catevCX:licence.catev);
        await this.entityManager.save(racerowToUpdate);
    }

    @Put('/flagChallenge')
    @ApiOperation({
        summary: 'Classe le vainqueur du challenge',
        operationId: 'flagChallenge',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async flagChallenge(@Body() raceRow: RaceRow): Promise<void> {
        const racerowToUpdate = await this.entityManager.findOne<RaceEntity>(RaceEntity, {
            id: raceRow.id,
        });
        racerowToUpdate.sprintchallenge = !racerowToUpdate.sprintchallenge;
        await this.entityManager.save(racerowToUpdate);
    }

    @Put('/reorderRank')
    @ApiOperation({
        summary: 'Réordonne le classement',
        operationId: 'reorderRanking',
    })
    @ApiBody({ type: [RaceRow] })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async reorderRanking(@Body() racesrows: RaceRow[]): Promise<void> {
        // Lets remove non ranked riders and DSQ/ABD
        Logger.debug('Reorder ranking');
        const rows = _.remove(racesrows, item => item.id && !item.comment);
        for (let index = 1; index <= rows.length; index++) {
            const item = rows[index - 1];
            // TODO Warning n+1 Select here
            const raceRowToSave: RaceEntity = await this.entityManager.findOne(RaceEntity, {id: item.id});
            if (raceRowToSave.rankingScratch !== index && !raceRowToSave.comment) {
                raceRowToSave.rankingScratch = index;
                Logger.debug('Update Ranking of rider number ' + raceRowToSave.riderNumber + ' with rank ' + (index));
                await this.entityManager.save(raceRowToSave);
            }
        }
    }

    @Put('/removeRanking')
    @ApiOperation({
        summary: 'Supprime un coureur du classement',
        operationId: 'removeRanking',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async removeRanking(@Body() raceRow: RaceRow): Promise<void> {
        Logger.debug('RemoveRanking with raceRow=' + JSON.stringify(raceRow));
        const racerowToUpdate = await this.entityManager.findOne<RaceEntity>(RaceEntity, {
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
        const races = await this.entityManager.find(RaceEntity, {
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
        summary: 'Met à jour le classement du coureur ',
        operationId: 'updateRanking',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async updateRanking(@Body() raceRow: RaceRow)
        : Promise<void> {
        Logger.debug('Update Rank for rider ' + JSON.stringify(raceRow));
        // Lets find first the corresponding Race row rider
        const requestedRankedRider = await this.entityManager.findOne<RaceEntity>(RaceEntity, {
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
        // Check if there is existing rider with this rank in this race with the same dossard only for real Ranked update
        if (raceRow.rankingScratch) {
            const rankRiderToChange = await this.entityManager.findOne(RaceEntity, {
                rankingScratch: raceRow.rankingScratch,
                raceCode: raceRow.raceCode,
                competition: {id: raceRow.competitionId},
            });
            // If a rider already exist, it depends on the existing ranking
            // if the ranking is the one we want to change, its and edit, no problem, we remove him
            if (rankRiderToChange) {
                Logger.debug('A rider exist with this rank ' + JSON.stringify(rankRiderToChange)
                    + ' New Rank to update =' + raceRow.rankingScratch);
                if (rankRiderToChange.rankingScratch === raceRow.rankingScratch) {
                    Logger.debug('Existing rider will be removed from ranking ' + JSON.stringify(rankRiderToChange));
                    rankRiderToChange.rankingScratch = null;
                    rankRiderToChange.comment = null;
                    await this.entityManager.save(rankRiderToChange);
                }
            }
        }
        requestedRankedRider.rankingScratch = raceRow.rankingScratch;
        requestedRankedRider.comment = raceRow.comment;
        await this.entityManager.save(requestedRankedRider);
    }

    @Delete('/:id')
    @ApiOperation({
        summary: 'Supprime une course',
        operationId: 'deleteRace',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async delete(@Param('id') id: string)
        : Promise<void> {
        this.entityManager.delete(RaceEntity, id);
    }
}
