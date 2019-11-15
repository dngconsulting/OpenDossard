import {ActionType, IAppAction} from '../actions/Helpers';
import {IAppState} from '../state/IAppState';

const initialState: IAppState = {}
export const AppReducer = (state: IAppState = initialState, action: IAppAction): IAppState => {
    switch (action.type) {
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
        default:
            return state;
    }
};
