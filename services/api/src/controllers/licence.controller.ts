import {LicenceEntity} from '../entity/licence.entity';
import {EntityManager, Repository} from 'typeorm';
import {Body, Controller, Delete, Get, Param, Post, Put, UseGuards} from '@nestjs/common';
import {InjectEntityManager, InjectRepository} from '@nestjs/typeorm';
import {ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {Filter, LicencesPage, Search} from './shared.model';
import {FederationEntity} from '../entity/federation.entity';
import {AuthGuard} from '@nestjs/passport';

/**
 * Licence Controler is in charge of handling rider licences
 * Mainly Crud operations & pagination
 */
@Controller('/api/licences')
@ApiUseTags('LicenceAPI')
@UseGuards(AuthGuard('jwt'))
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
        title: 'Recherche des licences',
        description: 'Rechercher des licences en fonction, du nom, prénom ou numéro de licence ',
    })
    @ApiResponse({status: 200, type: LicenceEntity, isArray: true, description: 'Liste des licences'})
    public async getLicencesLike(@Param('param') param: string): Promise<LicenceEntity> {
        const filterParam = '%' + param.replace(/\s+/g, '') + '%';
        const query: string = `select l.* from licence l where REPLACE(CONCAT(UPPER(l.name),UPPER(unaccent(l."firstName")),UPPER(CAST(l.fede AS VARCHAR)),UPPER(l."licenceNumber")),' ', '') like $1 OR REPLACE(CONCAT(UPPER(unaccent(l."firstName")),UPPER(l.name),UPPER(CAST(l.fede AS VARCHAR)),UPPER(l."licenceNumber")),' ','') like $1 fetch first 20 rows only`;
        return await this.entityManager.query(query, [filterParam]);
    }

    @Get(':id')
    @ApiOperation({
        operationId: 'get',
        title: 'Rechercher une licence par ID ',
        description: 'Recherche une licence par son identifiant',
    })
    @ApiResponse({status: 200, type: LicenceEntity, isArray: false, description: 'Renvoie une licence'})
    public async get(@Param('id') id: string): Promise<LicenceEntity> {
        return await this.repository.createQueryBuilder().where('id = :id', {id}).getOne();
    }

    @ApiOperation({
        operationId: 'getAllLicences',
        title: 'Rechercher toutes les licences ',
        description: 'Renvoie toutes les licences',
    })
    @ApiResponse({status: 200, type: LicenceEntity, isArray: true, description: 'Liste des licences'})
    @Get()
    public async getAllLicences(): Promise<LicenceEntity[]> {
        return this.repository.find();
    }

    @ApiOperation({
        operationId: 'getPageSizeLicencesForPage',
        title: 'Rechercher par page les licences ',
        description: 'Recherche paginée utilisant currentPage, pageSize, orderDirection, orderBy et Filters',
    })
    @Post('/filter')
    @ApiResponse({status: 200, type: LicencesPage})
    public async getPageSizeLicencesForPage(@Body() search: Search): Promise<LicencesPage> {
        const qb = this.repository.createQueryBuilder();
        if (search.search === '') {
            search.filters.forEach((filter: Filter) => {
                qb.andWhere(`"${filter.name}"` + ' ilike :' + filter.name, {[filter.name]: '%' + filter.value + '%'});
            });
            if (typeof search.orderBy !== 'undefined') {
                qb.orderBy(`"${search.orderBy}"`, search.orderDirection);
            }
        } else {
            qb.orWhere('"licenceNumber" ilike :value', {value: '%' + search.search + '%'});
            qb.orWhere(' name ilike :name', {name: '%' + search.search + '%'});
            qb.orWhere('"firstName" ilike :firstName', {firstName: '%' + search.search + '%'});
            qb.orWhere(' club ilike :club', {club: '%' + search.search + '%'});
            qb.orWhere(' "birthYear" ilike :birthYear', {birthYear: '%' + search.search + '%'});
            qb.orWhere(' dept ilike :dept', {dept: '%' + search.search + '%'});
        }
        const res = await
            qb
                .skip(search.currentPage * search.pageSize)
                .take(search.pageSize)
                .getManyAndCount();
        return {data: res[0], page: search.currentPage, totalCount: res[1]};
    }

    @Post()
    @ApiOperation({
        operationId: 'create',
        title: 'Cree une nouvelle licence',
    })
    public async create(@Body() licence: LicenceEntity): Promise<void> {
        const newLicence = new LicenceEntity();
        newLicence.licenceNumber = licence.licenceNumber;
        newLicence.name = licence.name;
        newLicence.firstName = licence.firstName;
        newLicence.gender = licence.gender.toUpperCase();
        newLicence.club = licence.club;
        newLicence.dept = licence.dept;
        newLicence.birthYear = licence.birthYear;
        newLicence.catea = licence.catea ?
            licence.gender.toUpperCase() === 'F' ? 'F' + licence.catea.toUpperCase() : licence.catea.toUpperCase()
            : '';
        newLicence.catev = licence.catev.toUpperCase();
        newLicence.fede = FederationEntity[licence.fede.toUpperCase()];
        await this.entityManager.save(newLicence);
    }

    @Put()
    @ApiOperation({
        title: 'Met à jour une licence existante',
        operationId: 'update',
    })
    public async update(@Body() licence: LicenceEntity)
        : Promise<void> {
        const toUpdate = await this.entityManager.findOne(LicenceEntity, licence.id);
        toUpdate.licenceNumber = licence.licenceNumber;
        toUpdate.birthYear = licence.birthYear;
        toUpdate.name = licence.name;
        toUpdate.firstName = licence.firstName;
        toUpdate.gender = licence.gender.toUpperCase();
        toUpdate.dept = licence.dept;
        toUpdate.catea = licence.catea ?
            licence.gender.toUpperCase() === 'F' ? 'F' + licence.catea.toUpperCase() : licence.catea.toUpperCase()
            : '';
        toUpdate.catev = licence.catev;
        await this.entityManager.save(toUpdate);
    }

    @Delete('/:id')
    @ApiOperation({
        title: 'Supprime une licence',
        operationId: 'delete',
    })
    public async delete(@Param('id') id: string)
        : Promise<void> {
        await this.entityManager.delete(LicenceEntity, id);
    }
}
