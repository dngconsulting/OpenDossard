import {CompetitionAPIApi, Configuration, LicenceAPIApi, RaceAPIApi, SecurityApi} from '../sdk';

const config = new Configuration({basePath :window.location.origin});

export const passportCtrl = new SecurityApi(config)
export const apiLicences = new LicenceAPIApi(config)
export const apiRaces = new RaceAPIApi(config)
export const apiCompetitions = new CompetitionAPIApi(config)
