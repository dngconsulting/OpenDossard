import {Action} from 'redux';

export enum ActionType {
    LISTE_COUREURS,
    OPEN_DRAWER,
    CLOSE_DRAWER,
    OPEN_ALERT,
    CLOSE_ALERT,
    OPEN_SPINNER,
    CLOSE_SPINNER,
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT_REQUEST,
    LOGOUT_SUCCESS,
    LOGOUT_FAIL,
    TEST,
    SET_VAR
}

export interface IAppAction extends Action<ActionType> {
    payload?: any;
}
