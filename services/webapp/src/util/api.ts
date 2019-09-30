import {Configuration, LicencesCtrlApi, PassportCtrlApi, RacesCtrlApi} from '../sdk';

const config = new Configuration({basePath :window.location.origin});

export const passportCtrl = new PassportCtrlApi(config)
export const apiLicences = new LicencesCtrlApi(config)
export const apiRaces = new RacesCtrlApi(config)
