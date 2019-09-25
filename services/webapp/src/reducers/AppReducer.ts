import {combineReducers} from 'redux';
import {
    TEST_ACTION
} from '../actions'

export interface ITypedAppState {
    test: string,
}

export type AppState = ITypedAppState

export interface IReduxState {
    app: AppState
}

const initAppState: AppState = {
    test: 'bonjour'
}

const app = (state = initAppState, action) => {
    const {type, payload} = action;

    switch(type) {
        case TEST_ACTION:
            return{
                ...state,
                test: payload
            }
        default:
            return state;
    }

};

export const AppReducer = combineReducers({
    app
});

