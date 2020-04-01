import {ReactElement} from "react";

interface IAlertButtonOptions {
    label: string;
    handler: () => void;
}

export interface IAlert {
    title?: string;
    message?: string;
    buttons?: IAlertButtonOptions[];
}


export class Alert implements IAlert {
    public title: string;
    public message?: string;
    public buttons: IAlertButtonOptions[];
}
