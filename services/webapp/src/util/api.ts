import {
    ClubAPIApi,
    CompetitionAPIApi,
    Configuration,
    LicenceAPIApi,
    RaceAPIApi,
    SecurityApi
} from '../sdk';

export const apiconfig = new Configuration({basePath: window.location.origin});
let bearerToken: string = null;

/**
 * This dynamic proxy handler provides aptions customization to Fetch requests without
 * polluting all users code with api.request(userparam, [options])
 * specially interesting for bearer tokens
 * @param obj that we want to decorate
 */
const enhance = (obj: any) => {
    const handler = {
        get: (target: any, key: any): any => {
            const origMethod = target[key];
            if (!origMethod) {
                return;
            }
            return (...args: any) => {
                if (bearerToken) {
                    args.push({headers: {'Authorization': 'Bearer ' + bearerToken}})
                };
                const result = origMethod.apply(target, args);
                return result;
            };
        }
    };
    return new Proxy(obj, handler);
}

export const setBearerToken = (token: string) => {
    bearerToken = token;
};
export const passportCtrl = enhance(new SecurityApi(apiconfig,apiconfig.basePath))
export const apiLicences = enhance(new LicenceAPIApi(apiconfig,apiconfig.basePath))
export const apiRaces = enhance(new RaceAPIApi(apiconfig,apiconfig.basePath))
export const apiCompetitions = enhance(new CompetitionAPIApi(apiconfig,apiconfig.basePath))
export const apiClubs = enhance(new ClubAPIApi(apiconfig,apiconfig.basePath))

