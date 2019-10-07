import {ActionType, IAppAction} from '../actions/Helpers';
import {AppState} from '../state/AppState';

const initialState: AppState = {}
export const AppReducer = (state: AppState = initialState, action: IAppAction): AppState => {
    switch (action.type) {
        case ActionType.TEST:
            return {
                ...state,
                ...action.payload
            };
        case ActionType.LISTE_COUREURS:
            return {
                ...state,
                licences: [],
            };
        case ActionType.SET_VAR:
            return {
                ...state,
                ...action.payload
            };
        case ActionType.SET_NOTIFICATION:
            return {
                ...state,
                notification: action.payload
            };
        default:
            return state;
    }
};
