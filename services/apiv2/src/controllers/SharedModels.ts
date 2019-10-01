import {ApiModelPropertyOptional} from '@nestjs/swagger';
import {Licence} from '../entity/Licence';

export class Filter {
    @ApiModelPropertyOptional()
    name: string;
    @ApiModelPropertyOptional()
    value: string;
}

export class LicencesPage {
    @ApiModelPropertyOptional({type: Licence, isArray: true})
    data: Licence[];
    @ApiModelPropertyOptional()
    page: number;
    @ApiModelPropertyOptional()
    totalCount: number;
}

export class Search {
    @ApiModelPropertyOptional()
    currentPage: number;
    @ApiModelPropertyOptional()
    pageSize: number;
    @ApiModelPropertyOptional()
    orderDirection?: 'ASC' | 'DESC';
    @ApiModelPropertyOptional()
    orderBy?: string;
    @ApiModelPropertyOptional({type: Filter, isArray: true})
    filters?: Filter[];
}
