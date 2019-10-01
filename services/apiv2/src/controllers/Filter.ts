import {ApiModelProperty} from '@nestjs/swagger';

export default class Filter {
    @ApiModelProperty()
    name: string;
    @ApiModelProperty()
    value: string;
}
