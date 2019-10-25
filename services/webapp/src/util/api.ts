import {
    ClubAPIApi,
    CompetitionAPIApi,
    Configuration,
    LicenceAPIApi,
    RaceAPIApi,
    SecurityApi
} from '../sdk';

export const apiconfig = new Configuration({basePath :window.location.origin});

export const passportCtrl = new SecurityApi(apiconfig,apiconfig.basePath)
export const apiLicences = new LicenceAPIApi(apiconfig,apiconfig.basePath)
export const apiRaces = new RaceAPIApi(apiconfig,apiconfig.basePath)
export const apiCompetitions = new CompetitionAPIApi(apiconfig,apiconfig.basePath)
export const apiClubs = new ClubAPIApi(apiconfig,apiconfig.basePath)
