import {
    ClubAPIApi,
    CompetitionAPIApi,
    Configuration,
    LicenceAPIApi,
    RaceAPIApi,
    SecurityApi
} from '../sdk';
import {store} from '../store/Store';
import {logout} from '../actions/App.Actions';

export const apiconfig = new Configuration({basePath: window.location.origin});
let bearerToken: string = null;
/**
 * This dynamic proxy handler provides aptions customization to Fetch requests without
 * polluting all users code with api.request(userparam, [options])
 * specially interesting for bearer tokens
 * Note that we don't want to decorate all fetch calls, just our API calls
 * @param obj that we want to decorate
 */
const enhance = (obj: any) => {
    const handler = {
        get: (target: any, key: any): any => {
            const origMethod = target[key];
            if (!origMethod) {
                return;
            }
            return async (...args: any) => {
                if (bearerToken) {
                    args.push({headers: {'Authorization': 'Bearer ' + bearerToken}});
                }
                ;
                // The endpoint API call api.service()
                try {
                    let result: any = null;
                    result = await origMethod.apply(target, args);
                    return result;
                } catch (rep)   {
                    if (rep) {
                        const r = await rep.json()
                        if (r && r.statusCode === 401) {
                            console.log('token expired, redirecting login page ...')
                            // static store access, probably better to inject dispatch via connect()
                            store.dispatch(logout())
                        }
                    }
                    // In all cases it is necessary to propagate the exception
                    throw rep;
                }
             };
        }
    };
    return new Proxy(obj, handler);
};

export const setBearerToken = (token: string) => {
    bearerToken = token;
};
export const passportCtrl = enhance(new SecurityApi(apiconfig, apiconfig.basePath));
export const apiLicences = enhance(new LicenceAPIApi(apiconfig, apiconfig.basePath));
export const apiRaces = enhance(new RaceAPIApi(apiconfig, apiconfig.basePath));
export const apiCompetitions = enhance(new CompetitionAPIApi(apiconfig, apiconfig.basePath));
export const apiClubs = enhance(new ClubAPIApi(apiconfig, apiconfig.basePath));

