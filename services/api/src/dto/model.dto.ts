import {LicenceEntity} from '../entity/licence.entity';
import {IsInt, IsString} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class ClubRow {
    @IsInt()
    public id?: number;
    public longName?: string;
    public dept?: string;
    public shortName?: string;
}

export class CompetitionReorganize {
    @IsInt()
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
    public name?: string;
    public riderName?: string;
    public club?: string;
    public catev?: string;
    public catea?: string;
    public fede?: string;
    public gender?: string;
    public rankingScratch: number;
    public comment: string;
    public competitionId: number;
    public competitionName?: string;
    @ApiPropertyOptional({ type: 'string', format: 'date-time'})
    public competitionDate?: Date;
    public sprintchallenge?: boolean;
}

export class RaceCreate {
    @IsInt()
    public competitionId?: number;
    public licenceId?: number;
    public riderNumber?: number;
    public raceCode?: string;
    public catev?: string;
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
    @IsString()
    name?: string;
    value?: string;
}

export class LicencesPage {
    data?: LicenceEntity[];
    @IsInt()
    page?: number;
    totalCount?: number;
}

export class Search {
    @IsInt()
    currentPage?: number;
    pageSize?: number;
    orderDirection?: 'ASC' | 'DESC';
    orderBy?: string;
    search?: string;
    filters?: Filter[];
}
