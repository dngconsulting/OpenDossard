import {EntityManager} from 'typeorm';

import {Race} from '../entity/Race';
import {Licence} from '../entity/Licence';
import {Competition} from '../entity/Competition';
import {ApiModelPropertyOptional, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
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
    @ApiModelPropertyOptional({ type: 'string', format: 'date-time'})
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

    @Put('/update')
    @ApiOperation({
        title: 'Met à jour le classement du coureur ',
        operationId: 'update',
    })
    public async updateRanking(@Body() raceRow: RaceRow)
        : Promise<void> {
        // Lets find first the corresponding Race row rider
        const requestedRankedRider = await this.entityManager.findOne(Race, {
            riderNumber: raceRow.riderNumber,
            raceCode: raceRow.raceCode,
        });
        if (!requestedRankedRider) {
            throw(new BadRequestException('Impossible de classer ce coureur, ' + JSON.stringify(requestedRankedRider) + ' il n\'existe pas'));
        }
        console.log('Rank for ' + JSON.stringify(requestedRankedRider));
        // Check if this rider has already a rank
        if (requestedRankedRider.rankingScratch != null) {
            throw(new BadRequestException('Impossible de classer ce coureur, ' + JSON.stringify(requestedRankedRider) + ' il existe déjà dans le classement'));
        }
        // Check if there is existing rider with this rank in this race with the same dossard
        const existRankRider = await this.entityManager.findOne(Race, {
            rankingScratch: raceRow.rankingScratch,
            raceCode: raceRow.raceCode,
        });
        // If a rider already exist, it depends on the existing ranking
        // if the ranking is the one we want to change, its and edit, no problem, we remove the existing
        // if the ranking is another one, raise a message and ask the user to remove manually the existing
        // rider
        if (existRankRider) {
            Logger.debug('A rider exist with this rank ' + JSON.stringify(existRankRider));
            if (existRankRider.rankingScratch === raceRow.rankingScratch) {
                Logger.debug('Existing rider will be removed from ranking ' + JSON.stringify(existRankRider));
                existRankRider.rankingScratch = null;
                existRankRider.comment = null;
                await this.entityManager.save(existRankRider);
            } else {
                Logger.warn('Impossible to rank this rider please remove before ' + JSON.stringify(existRankRider));
                throw(new BadRequestException('Déclasser le coureur ' + existRankRider.id + ' avant de classer ce coureur'));
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
