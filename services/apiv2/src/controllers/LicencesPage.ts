import {ApiModelProperty} from '@nestjs/swagger';
import {Licence} from '../entity/Licence';

export default class LicencesPage {
    @ApiModelProperty({type: Licence, isArray: true})
    data: Licence[];
    @ApiModelProperty()
    page: number;
    @ApiModelProperty()
    totalCount: number;
}
