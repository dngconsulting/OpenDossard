import {Configuration, LicencesCtrlApi} from '../sdk';

export const apiLicences = new LicencesCtrlApi(new Configuration({basePath :window.location.origin}))

