import {ActionType, IAppAction} from './../actions/Helpers';
import {Utility} from '../state/Utility';

export const UtilityReducer = (state: Utility = new Utility(), action: IAppAction): Utility => {
    switch (action.type) {
        case ActionType.OPEN_DRAWER:
            return new Utility(true,null,null);
        case ActionType.CLOSE_DRAWER:
            return new Utility(false,null,null);
        case ActionType.OPEN_ALERT:
            return new Utility(false,action.payload,null);
        case ActionType.CLOSE_ALERT:
            return new Utility(false,null,null);
        case ActionType.OPEN_SPINNER:
            return new Utility(false, null, action.payload);
        case ActionType.CLOSE_SPINNER:
            return new Utility(false,null,null);
        default:
            return state;
    }
};
