import {LicenceEntity} from '../entity/licence.entity';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import { ClubEntity } from 'src/entity/club.entity';
import { FederationEntity } from 'src/entity/federation.entity';
import { Category, CompetitionType } from 'src/entity/competition.entity';
import { PricingInfo } from 'src/entity/pricing-info';

export class ClubRow {
    public id?: number;
    public longName?: string;
    public dept?: string;
    public shortName?: string;
}

export class CompetitionReorganize {
    public competitionId?: number;
    public races?: string[];
}

export class RaceRow {
    public id?: number;
    public raceCode?: string;
    public birthYear?: string;
    public riderNumber?: number;
    public surclassed?: boolean;
    public licenceNumber?: string;
    public licenceId?:string;
    public name?: string;
    public riderName?: string;
    public club?: string;
    public catev?: string;
    public catea?: string;
    public dept?:string;
    public fede?: string;
    public gender?: string;
    public rankingScratch: number;
    public comment: string;
    public competitionId: number;
    public competitionName?: string;
    public competitionType?:string;
    public competitionRaces?:string[];
    @ApiPropertyOptional({ type: 'string', format: 'date-time'})
    public competitionDate?: Date;
    public sprintchallenge?: boolean;
}

export class RaceCreate {
    public competitionId?: number;
    public licenceId?: number;
    public riderNumber?: number;
    public raceCode?: string;
    public catev?: string;
    public catea?: string;
    public club?: string;
    public rankingScratch?: number;
}

export class RaceNbRider {
    public count?: number;
    public raceCode?: string;
    public name?: string;
    @ApiProperty({ type: 'string', format: 'date-time'})
    public date?: Date;
    public fede?: string;
}

export class Filter {
    name?: string;
    value?: string;
}

export class LicencesPage {
    data?: LicenceEntity[];
    page?: number;
    totalCount?: number;
}

export class Search {
    currentPage?: number;
    pageSize?: number;
    @ApiProperty({ type: 'string'})
    orderDirection?: 'ASC' | 'DESC';
    orderBy?: string;
    search?: string;
    filters?: Filter[];
}

export class CompetitionFilter {
    competitionTypes?: string[];
    fedes?: string[];
    depts?: Departement[];
    openedToOtherFede?: boolean;
    openedNL?: boolean;
    displayFuture?: boolean;
    displayPast?: boolean;
    displaySince?: number;
    startDate?:string;
    endDate?:string;
}

export class Departement {
    departmentCode : string;
    departmentName: string;
    regionCode: string;
    regionName:string;
}

export class CompetitionCreate{
    
    competitionId: number;
    name: string;
    competitionType?:CompetitionType;
    fede?:FederationEntity;
    categories?:Category[];
    races?: string[];
    eventDate : Date;
    zipCode : string;
    club : ClubEntity;
    info ?: string;
    lapNumber?: string;
    longueurCircuit ?: string;
    contactPhone ?: string;
    contactEmail ?: string;
    siteWeb ?: string;
    facebook ?: string;
    latitude ?: number;
    longitude ?: number;
    pricing ?: PricingInfo [];
    startDate ?:string;
    openedToOtherFede?: boolean;
    openedNL?: boolean;
    observations?:string;
    lieu_dossard?:string;
    lieu_dossard_gps?:number[];
    contact_name?:string;
    commissaires?:string;
    speaker?:string;
    aboyeur?:string;
    feedback?:string;
    results_validated?:boolean;
}
