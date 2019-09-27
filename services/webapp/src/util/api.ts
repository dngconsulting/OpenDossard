import {Configuration, LicencesCtrlApi, PassportCtrlApi} from '../sdk';
const config = new Configuration({basePath :window.location.origin})
export const apiLicences = new LicencesCtrlApi(config)
export const passportCtrl = new PassportCtrlApi(config)
