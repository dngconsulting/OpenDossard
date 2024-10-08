import { AuthAPIApi, ChallengeAPIApi, ClubAPIApi, CompetitionAPIApi, LicenceAPIApi, RaceAPIApi } from '../sdk/apis';
// @ts-ignore
import * as portableFetch from 'portable-fetch';
import { Configuration, ConfigurationParameters, RequestContext, ResponseContext } from '../sdk';
import { store } from '../store/Store';
import { logout } from '../actions/App.Actions';

export let defaultApiconfig: ConfigurationParameters = {
  fetchApi: portableFetch,
  basePath: window.location.origin,
  middleware: [
    {
      pre(context: RequestContext): any {
        const authHeader = context.init.headers['Authorization'];
        if (!authHeader) {
          console.log('no token in the request, lets get the existing one ');
          const token = localStorage.getItem('token');
          if (token) {
            context.init.headers['Authorization'] = 'Bearer ' + token;
            loadSDK(token);
          }
        }
      },
      post: async (context: ResponseContext): Promise<void> => {
        if (context.response.status === 401 && !context.url.includes('/auth/login')) {
          console.log('token expired, redirecting login page ...');
          // static store access, probably better to inject dispatch via connect()
          store.dispatch(logout());
        }
      }
    }
  ]
};

export let passportCtrl: AuthAPIApi;
export let apiLicences: LicenceAPIApi;
export let apiRaces: RaceAPIApi;
export let apiCompetitions: CompetitionAPIApi;
export let apiClubs: ClubAPIApi;
export let apiChallenge: ChallengeAPIApi;

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
  apiChallenge = new ChallengeAPIApi(apiconfig);
};
