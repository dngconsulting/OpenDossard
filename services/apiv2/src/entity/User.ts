/**
 * Application users
 * TODO : not an entity/table yet, users are located in users.json
 */
import {ApiModelProperty} from '@nestjs/swagger';

export class User {
    @ApiModelProperty()
    id?: string;
    @ApiModelProperty()
    firstName: string;
    @ApiModelProperty()
    lastName: string;
    password: string;
    @ApiModelProperty()
    email: string;
    @ApiModelProperty()
    phone?: string;
}
