/**
 * Application users
 * TODO : not an entity/table yet, users are located in users.json
 */
import {ApiModelProperty, ApiModelPropertyOptional} from '@nestjs/swagger';

export class User {
    @ApiModelPropertyOptional()
    id?: string;
    @ApiModelPropertyOptional()
    firstName: string;
    @ApiModelPropertyOptional()
    lastName: string;
    @ApiModelPropertyOptional()
    password: string;
    @ApiModelProperty()
    email: string;
    @ApiModelPropertyOptional()
    phone?: string;
}
