import * as _ from 'lodash';

export interface IUser {
    email?: string;
    name?: string;
    roles?: string[];
}

export class User implements IUser {
    public static EMAIL = 'email';
    public static NAME = 'name';
    public static ROLES = 'roles';

    public email: string;
    public name: string;
    public roles: string[];

    constructor(email?: string, name?: string, roles?: string[]) {
        this.email = email;
        this.name = name;
        this.roles = roles;
    }

    public isInRole(candidate: string) {
        return _.intersection(this.roles, [candidate]).length > 0;
    }
}
