import {ActionType, IAppAction} from '../actions/Helpers';
import {AppState} from '../state/AppState';

export const AppReducer = (state: AppState = null, action: IAppAction): AppState => {
    switch (action.type) {
        case ActionType.TEST:
            return {
                ...state,
                ...action.payload
            };
        case ActionType.LISTE_COUREURS:
            return {
                ...state,
                licences : [],
            };

        default:
            return state;
    }
};