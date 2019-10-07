import {Licence} from '../sdk';
import {INotification} from "../components/CadSnackbar";

export interface AppState {
    test?: string;
    licences? : Licence[];
    notification?: INotification;
}
