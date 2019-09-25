import {combineReducers} from 'redux';
import {UtilityReducer} from './UtilityReducer';
import {AuthenticationReducer} from './AuthenticationReducer';
import {AppReducer} from './AppReducer';

export const reducers = combineReducers({
    utility: UtilityReducer,
    authentication: AuthenticationReducer,
    app: AppReducer,
});
