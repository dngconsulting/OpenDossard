import {connectedRouterRedirect} from 'redux-auth-wrapper/history4/redirect';
import {Utility} from './Utility';
import {AppState} from './AppState';
import {User} from '../sdk';

export interface IReduxState {
    utility?: Utility;
    authentication?: User;
    app : AppState;
}

export class ReduxState implements IReduxState {
    public static UTILITY = 'utility';
    public static AUTHENTICATION = "authentication";
    public static APP = "app";

    public utility: Utility;
    public authentication: User;
    public app : AppState;
}

export const isAuthenticated = connectedRouterRedirect({
    redirectPath: '/account/login',
    authenticatedSelector: (state: ReduxState) => state.authentication !== null,
    wrapperDisplayName: 'Authenticated'
}) as any;
