/**
 * Application users
 * TODO : not an entity/table yet, users are located in users.json
 */
import {Property} from '@tsed/common';

export class User {
    id?: string;
    @Property()
    firstName: string;
    @Property()
    lastName: string;
    password: string;
    @Property()
    email: string;
    @Property()
    phone?: string;
}
