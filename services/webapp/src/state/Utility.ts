import {Alert} from './Alert';
import {Spinner} from './Spinner';

export interface IUtility {
    drawerOpen?: boolean;
    alert?: Alert;
    spinner?: Spinner;
}

export class Utility implements IUtility {
    public static DRAWER_OPEN = 'drawerOpen';
    public static ALERT = 'alert';
    public static SPINNER = 'spinner';

    constructor(drawerOpen?: boolean, alert?: Alert, spinner?: Spinner) {
        this.drawerOpen = drawerOpen;
        this.alert = alert;
        this.spinner = spinner;
    }

    public drawerOpen: boolean = false;
    public alert: Alert = null;
    public spinner: Spinner = null;
}
