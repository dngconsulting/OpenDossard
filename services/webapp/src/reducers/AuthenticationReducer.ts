import {ActionType, IAppAction} from './../actions/Helpers';
import {UserEntity as User} from '../sdk';

export const AuthenticationReducer = (state: User = null, action: IAppAction): User => {
    switch (action.type) {
        case ActionType.LOGIN_REQUEST:
            return {...action.payload};
        case ActionType.LOGOUT_REQUEST:
            return null;
        default:
            return state;
    }
};
