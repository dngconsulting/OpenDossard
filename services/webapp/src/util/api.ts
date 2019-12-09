import {AuthAPIApi, ClubAPIApi, CompetitionAPIApi, LicenceAPIApi, RaceAPIApi} from '../sdk/apis';
// @ts-ignore
import * as portableFetch from 'portable-fetch';
import {Configuration, ConfigurationParameters, RequestContext, ResponseContext} from '../sdk';
import {store} from '../store/Store';
import {logout} from '../actions/App.Actions';

export let defaultApiconfig: ConfigurationParameters = {
    fetchApi: portableFetch,
    basePath: window.location.origin,
    middleware: [{
        post: async (context: ResponseContext): Promise<void> => {
            if (context.response.status === 401) {
                console.log('token expired, redirecting login page ...')
                // static store access, probably better to inject dispatch via connect()
                store.dispatch(logout())
            }
        }
    }]
};

export let passportCtrl: AuthAPIApi;
export let apiLicences: LicenceAPIApi;
export let apiRaces: RaceAPIApi;
export let apiCompetitions: CompetitionAPIApi;
export let apiClubs: ClubAPIApi;

export const loadSDK = (token?: string) => {
    if (token) {
        defaultApiconfig.accessToken = token;
    }
    const apiconfig: Configuration = new Configuration(defaultApiconfig);
    passportCtrl = new AuthAPIApi(apiconfig);
    apiLicences = new LicenceAPIApi(apiconfig);
    apiRaces = new RaceAPIApi(apiconfig);
    apiCompetitions = new CompetitionAPIApi(apiconfig);
    apiClubs = new ClubAPIApi(apiconfig);
};


