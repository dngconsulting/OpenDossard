import {
    Configuration,
    LicenceAPIApiFactory,
    RaceAPIApiFactory,
    SecurityApiFactory
} from '../sdk';

const config = new Configuration({basePath :window.location.origin});

export const passportCtrl = SecurityApiFactory(config)
export const apiLicences = LicenceAPIApiFactory(config)
export const apiRaces = RaceAPIApiFactory(config)
