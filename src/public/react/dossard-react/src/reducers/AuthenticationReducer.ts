import {ActionType, IAppAction} from './../actions/Helpers';
import {User} from '../state/User';

export const AuthenticationReducer = (state: User = null, action: IAppAction): User => {
    switch (action.type) {
        case ActionType.LOGIN_REQUEST:
            return new User(action.payload.email, 'Sami Jaber', ['Admin']);
        case ActionType.LOGOUT_REQUEST:
            return null;
        default:
            return state;
    }
};
