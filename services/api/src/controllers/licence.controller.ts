import {LicenceEntity} from '../entity/licence.entity';
import {EntityManager, Repository} from 'typeorm';
import {Body, Controller, Delete, Get, Logger, Param, Post, Put, UseGuards} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Filter, LicencesPage, Search} from '../dto/model.dto';
import {AuthGuard} from '@nestjs/passport';
import {ROLES, RolesGuard} from "../guards/roles.guard";
import {Roles} from "../decorators/roles.decorator";
import {mappingLicenceFields} from "../util";

/**
 * Licence Controler is in charge of handling rider licences
 * Mainly Crud operations & pagination
 */
@Controller('/api/licences')
@ApiTags('LicenceAPI')
@UseGuards(AuthGuard('jwt'),RolesGuard)
export class LicenceController {
    constructor(
        @InjectRepository(LicenceEntity)
        private readonly repository: Repository<LicenceEntity>,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    @Get('/search/:param')
    @ApiOperation({
        operationId: 'getLicencesLike',
        summary: 'Recherche des licences',
        description: 'Rechercher des licences en fonction, du nom, prénom ou numéro de licence ',
    })
    @ApiResponse({status: 200, type: LicenceEntity, isArray: true, description: 'Liste des licences'})
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async getLicencesLike(@Param('param') param: string): Promise<LicenceEntity> {
        const filterParam = '%' + param.replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '%';
        const query: string = `select l.licence_number as "licenceNumber",
                              l.id,
                              l.club,
                              l.gender,
                              l.name,
                              l.dept,
                              l.fede,
                              l.first_name as "firstName",
                              l.birth_year as "birthYear",
                              l.catev,
                              l.catea from licence l where REPLACE(CONCAT(UPPER(l.name),UPPER(unaccent(l.first_name)),UPPER(CAST(l.fede AS VARCHAR)),UPPER(l.licence_number)),' ','') like $1 
                              order by (l.name,l.first_name) fetch first 20 rows only`;
        return await this.entityManager.query(query, [filterParam]);
    }

    @Get(':id')
    @ApiOperation({
        operationId: 'get',
        summary: 'Rechercher une licence par ID ',
        description: 'Recherche une licence par son identifiant',
    })
    @ApiResponse({status: 200, type: LicenceEntity, isArray: false, description: 'Renvoie une licence'})
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async get(@Param('id') id: string): Promise<LicenceEntity> {
        return await this.repository.createQueryBuilder().where('id = :id', {id}).getOne();
    }

    @ApiOperation({
        operationId: 'getAllLicences',
        summary: 'Rechercher toutes les licences ',
        description: 'Renvoie toutes les licences',
    })
    @ApiResponse({status: 200, type: LicenceEntity, isArray: true, description: 'Liste des licences'})
    @Get()
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async getAllLicences(): Promise<LicenceEntity[]> {
        return this.repository.find();
    }

    @ApiOperation({
        operationId: 'getPageSizeLicencesForPage',
        summary: 'Rechercher par page les licences ',
        description: 'Recherche paginée utilisant currentPage, pageSize, orderDirection, orderBy et Filters',
    })
    @Post('/filter')
    @ApiResponse({status: 200, type: LicencesPage})
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async getPageSizeLicencesForPage(@Body() search: Search): Promise<LicencesPage> {
        Logger.debug('Search=' + JSON.stringify(search))
        const qb = this.repository.createQueryBuilder();
        if (search.search === '') {
            const fid : Filter[] = search.filters.filter((f:Filter)=>f.name==='id')
            if (fid.length>0) {
                qb.andWhere('id=:id' ,{id:fid.pop().value})
            } else {
                search.filters.forEach((filter: Filter) => {
                    qb.andWhere(mappingLicenceFields[filter.name] + ' ilike :' + filter.name, {[filter.name]: '%' + filter.value + '%'});
                });

                if (typeof search.orderBy !== 'undefined') {
                    qb.orderBy(`"${mappingLicenceFields[search.orderBy]}"`, search.orderDirection);
                } else {
                    qb.orderBy('name', search.orderDirection);
                }
            }
        } else {
            qb.orWhere('licence_number ilike :value', {value: '%' + search.search + '%'});
            qb.orWhere(' name ilike :name', {name: '%' + search.search + '%'});
            qb.orWhere('first_name ilike :firstName', {firstName: '%' + search.search + '%'});
            qb.orWhere(' club ilike :club', {club: '%' + search.search + '%'});
            qb.orWhere(' birth_year ilike :birthYear', {birthYear: '%' + search.search + '%'});
            qb.orWhere(' dept ilike :dept', {dept: '%' + search.search + '%'});
        }
        const res = await
            qb
                .skip(search.currentPage * search.pageSize)
                .take(search.pageSize)
                .getManyAndCount();
        return {data: res[0], page: search.currentPage, totalCount: res[1]};
    }

    // TODO : It is also possible to use @Transaction decorator here
    // See https://typeorm.io/#/transactions
    @Post()
    @ApiOperation({
        operationId: 'create',
        summary: 'Cree une nouvelle licence',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async create(@Body() licence: LicenceEntity): Promise<LicenceEntity> {
        const newLicence = new LicenceEntity();
        newLicence.licenceNumber = licence.licenceNumber;
        newLicence.name = licence.name;
        newLicence.firstName = licence.firstName;
        newLicence.gender = licence.gender.toUpperCase();
        newLicence.club = licence.club;
        newLicence.dept = licence.dept;
        newLicence.birthYear = licence.birthYear;
        newLicence.catea = licence.catea;
        newLicence.catev = licence.catev.toUpperCase();
        newLicence.fede = licence.fede;
        const licenceInserted = await this.entityManager.save(newLicence);
        return licenceInserted
    }

    @Put()
    @ApiOperation({
        summary: 'Met à jour une licence existante',
        operationId: 'update',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async update(@Body() licence: LicenceEntity)
        : Promise<void> {
        const toUpdate = await this.entityManager.findOne(LicenceEntity, licence.id);
        toUpdate.licenceNumber = licence.licenceNumber;
        toUpdate.fede=licence.fede;
        toUpdate.club=licence.club
        toUpdate.birthYear = licence.birthYear;
        toUpdate.name = licence.name;
        toUpdate.firstName = licence.firstName;
        toUpdate.gender = licence.gender.toUpperCase();
        toUpdate.dept = licence.dept;
        toUpdate.catea = licence.catea;
        toUpdate.catev = licence.catev;
        await this.entityManager.save(toUpdate);
    }

    @Delete('/:id')
    @ApiOperation({
        summary: 'Supprime une licence',
        operationId: 'delete',
    })
    @Roles(ROLES.ORGANISATEUR,ROLES.ADMIN)
    public async delete(@Param('id') id: string)
        : Promise<void> {
        await this.entityManager.delete(LicenceEntity, id);
    }
}
