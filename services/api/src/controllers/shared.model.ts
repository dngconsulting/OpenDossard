import {ApiModelPropertyOptional} from '@nestjs/swagger';
import {LicenceEntity} from '../entity/licence.entity';

export class Filter {
    @ApiModelPropertyOptional()
    name: string;
    @ApiModelPropertyOptional()
    value: string;
}

export class LicencesPage {
    @ApiModelPropertyOptional({type: LicenceEntity, isArray: true})
    data: LicenceEntity[];
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
    @ApiModelPropertyOptional()
    search: string;
    @ApiModelPropertyOptional({type: Filter, isArray: true})
    filters?: Filter[];
}
