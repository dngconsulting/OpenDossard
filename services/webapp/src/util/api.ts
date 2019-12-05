import {AuthAPIApi, ClubAPIApi, CompetitionAPIApi, LicenceAPIApi, RaceAPIApi} from '../sdk/apis';
// @ts-ignore
import * as portableFetch from 'portable-fetch';
import {Configuration} from '../sdk';
export let apiconfig = new Configuration({fetchApi: portableFetch,basePath: window.location.origin});
// TODO : code shall be optimized
export const setBearerToken = (token: string) => {
    apiconfig = new Configuration({apiKey:token,accessToken:token,fetchApi: portableFetch,basePath: window.location.origin});
    passportCtrl = new AuthAPIApi(apiconfig);
    apiLicences = new LicenceAPIApi(apiconfig);
    apiRaces = new RaceAPIApi(apiconfig);
    apiCompetitions = new CompetitionAPIApi(apiconfig);
    apiClubs = new ClubAPIApi(apiconfig);
};
export let passportCtrl = new AuthAPIApi(apiconfig);
export let apiLicences = new LicenceAPIApi(apiconfig);
export let apiRaces = new RaceAPIApi(apiconfig);
export let apiCompetitions = new CompetitionAPIApi(apiconfig);
export let apiClubs = new ClubAPIApi(apiconfig);

