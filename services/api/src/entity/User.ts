/**
 * Application users
 * TODO : not an entity/table yet, users are located in users.json
 */
export interface IUser {
    id?: string;
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    phone?: string;
}
