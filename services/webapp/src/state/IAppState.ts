import {LicenceEntity as Licence} from '../sdk';

export interface IAppState {
    test?: string;
    licences? : Licence[];
}
