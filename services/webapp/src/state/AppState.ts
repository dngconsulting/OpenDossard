import {Licence} from '../sdk';

export interface AppState {
    test?: string;
    licences? : Licence[];
    currentCompetition : string;
}
