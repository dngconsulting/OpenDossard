/// <reference path="./custom.d.ts" />
// tslint:disable
/**
 * Api documentation
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


import * as url from "url";
import * as portableFetch from "portable-fetch";
import { Configuration } from "./configuration";

const BASE_PATH = "https://localhost".replace(/\/+$/, "");

/**
 *
 * @export
 */
export const COLLECTION_FORMATS = {
    csv: ",",
    ssv: " ",
    tsv: "\t",
    pipes: "|",
};

/**
 *
 * @export
 * @interface FetchAPI
 */
export interface FetchAPI {
    (url: string, init?: any): Promise<Response>;
}

/**
 *  
 * @export
 * @interface FetchArgs
 */
export interface FetchArgs {
    url: string;
    options: any;
}

/**
 * 
 * @export
 * @class BaseAPI
 */
export class BaseAPI {
    protected configuration: Configuration;

    constructor(configuration?: Configuration, protected basePath: string = BASE_PATH, protected fetch: FetchAPI = portableFetch) {
        if (configuration) {
            this.configuration = configuration;
            this.basePath = configuration.basePath || this.basePath;
        }
    }
};

/**
 * 
 * @export
 * @class RequiredError
 * @extends {Error}
 */
export class RequiredError extends Error {
    name: "RequiredError"
    constructor(public field: string, msg?: string) {
        super(msg);
    }
}

/**
 * 
 * @export
 * @interface Licence
 */
export interface Licence {
    /**
     * 
     * @type {number}
     * @memberof Licence
     */
    id?: number;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    licenceNumber?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    firstName?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    gender?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    club?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    dept?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    birthYear?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    catea?: string;
    /**
     * 
     * @type {string}
     * @memberof Licence
     */
    catev?: string;
    /**
     * 
     * @type {any}
     * @memberof Licence
     */
    fede?: any;
}

/**
 * 
 * @export
 * @interface PassportCtrlLoginPayload
 */
export interface PassportCtrlLoginPayload {
    /**
     * 
     * @type {string}
     * @memberof PassportCtrlLoginPayload
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof PassportCtrlLoginPayload
     */
    password?: string;
}

/**
 * 
 * @export
 * @interface PassportCtrlSignupPayload
 */
export interface PassportCtrlSignupPayload {
    /**
     * 
     * @type {string}
     * @memberof PassportCtrlSignupPayload
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof PassportCtrlSignupPayload
     */
    password: string;
    /**
     * 
     * @type {string}
     * @memberof PassportCtrlSignupPayload
     */
    firstName: string;
    /**
     * 
     * @type {string}
     * @memberof PassportCtrlSignupPayload
     */
    lastName: string;
}

/**
 * 
 * @export
 * @interface RaceRow
 */
export interface RaceRow {
    /**
     * 
     * @type {number}
     * @memberof RaceRow
     */
    id?: number;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    raceCode?: string;
    /**
     * 
     * @type {number}
     * @memberof RaceRow
     */
    riderNumber?: number;
    /**
     * 
     * @type {number}
     * @memberof RaceRow
     */
    numberMin?: number;
    /**
     * 
     * @type {number}
     * @memberof RaceRow
     */
    numberMax?: number;
    /**
     * 
     * @type {boolean}
     * @memberof RaceRow
     */
    surclassed?: boolean;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    licenceNumber?: string;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    firstName?: string;
}

/**
 * 
 * @export
 * @interface User
 */
export interface User {
    /**
     * 
     * @type {string}
     * @memberof User
     */
    firstName?: string;
    /**
     * 
     * @type {string}
     * @memberof User
     */
    lastName?: string;
    /**
     * 
     * @type {string}
     * @memberof User
     */
    email?: string;
    /**
     * 
     * @type {string}
     * @memberof User
     */
    phone?: string;
}


/**
 * LicencesCtrlApi - fetch parameter creator
 * @export
 */
export const LicencesCtrlApiFetchParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        get(id: string, options: any = {}): FetchArgs {
            // verify required parameter 'id' is not null or undefined
            if (id === null || id === undefined) {
                throw new RequiredError('id','Required parameter id was null or undefined when calling get.');
            }
            const localVarPath = `/api/licences/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllLicences(options: any = {}): FetchArgs {
            const localVarPath = `/api/licences`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        save(options: any = {}): FetchArgs {
            const localVarPath = `/api/licences`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'PUT' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * LicencesCtrlApi - functional programming interface
 * @export
 */
export const LicencesCtrlApiFp = function(configuration?: Configuration) {
    return {
        /**
         * 
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        get(id: string, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Response> {
            const localVarFetchArgs = LicencesCtrlApiFetchParamCreator(configuration).get(id, options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response;
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllLicences(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Array<Licence>> {
            const localVarFetchArgs = LicencesCtrlApiFetchParamCreator(configuration).getAllLicences(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        save(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Response> {
            const localVarFetchArgs = LicencesCtrlApiFetchParamCreator(configuration).save(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response;
                    } else {
                        throw response;
                    }
                });
            };
        },
    }
};

/**
 * LicencesCtrlApi - factory interface
 * @export
 */
export const LicencesCtrlApiFactory = function (configuration?: Configuration, fetch?: FetchAPI, basePath?: string) {
    return {
        /**
         * 
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        get(id: string, options?: any) {
            return LicencesCtrlApiFp(configuration).get(id, options)(fetch, basePath);
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllLicences(options?: any) {
            return LicencesCtrlApiFp(configuration).getAllLicences(options)(fetch, basePath);
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        save(options?: any) {
            return LicencesCtrlApiFp(configuration).save(options)(fetch, basePath);
        },
    };
};

/**
 * LicencesCtrlApi - object-oriented interface
 * @export
 * @class LicencesCtrlApi
 * @extends {BaseAPI}
 */
export class LicencesCtrlApi extends BaseAPI {
    /**
     * 
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof LicencesCtrlApi
     */
    public get(id: string, options?: any) {
        return LicencesCtrlApiFp(this.configuration).get(id, options)(this.fetch, this.basePath);
    }

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof LicencesCtrlApi
     */
    public getAllLicences(options?: any) {
        return LicencesCtrlApiFp(this.configuration).getAllLicences(options)(this.fetch, this.basePath);
    }

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof LicencesCtrlApi
     */
    public save(options?: any) {
        return LicencesCtrlApiFp(this.configuration).save(options)(this.fetch, this.basePath);
    }

}

/**
 * PassportCtrlApi - fetch parameter creator
 * @export
 */
export const PassportCtrlApiFetchParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        login(options: any = {}): FetchArgs {
            const localVarPath = `/api/passport/login`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'POST' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        logout(options: any = {}): FetchArgs {
            const localVarPath = `/api/passport/logout`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        signup(options: any = {}): FetchArgs {
            const localVarPath = `/api/passport/signup`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'POST' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * PassportCtrlApi - functional programming interface
 * @export
 */
export const PassportCtrlApiFp = function(configuration?: Configuration) {
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        login(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<User> {
            const localVarFetchArgs = PassportCtrlApiFetchParamCreator(configuration).login(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        logout(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Response> {
            const localVarFetchArgs = PassportCtrlApiFetchParamCreator(configuration).logout(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response;
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        signup(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Response> {
            const localVarFetchArgs = PassportCtrlApiFetchParamCreator(configuration).signup(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response;
                    } else {
                        throw response;
                    }
                });
            };
        },
    }
};

/**
 * PassportCtrlApi - factory interface
 * @export
 */
export const PassportCtrlApiFactory = function (configuration?: Configuration, fetch?: FetchAPI, basePath?: string) {
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        login(options?: any) {
            return PassportCtrlApiFp(configuration).login(options)(fetch, basePath);
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        logout(options?: any) {
            return PassportCtrlApiFp(configuration).logout(options)(fetch, basePath);
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        signup(options?: any) {
            return PassportCtrlApiFp(configuration).signup(options)(fetch, basePath);
        },
    };
};

/**
 * PassportCtrlApi - object-oriented interface
 * @export
 * @class PassportCtrlApi
 * @extends {BaseAPI}
 */
export class PassportCtrlApi extends BaseAPI {
    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PassportCtrlApi
     */
    public login(options?: any) {
        return PassportCtrlApiFp(this.configuration).login(options)(this.fetch, this.basePath);
    }

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PassportCtrlApi
     */
    public logout(options?: any) {
        return PassportCtrlApiFp(this.configuration).logout(options)(this.fetch, this.basePath);
    }

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof PassportCtrlApi
     */
    public signup(options?: any) {
        return PassportCtrlApiFp(this.configuration).signup(options)(this.fetch, this.basePath);
    }

}

/**
 * RacesCtrlApi - fetch parameter creator
 * @export
 */
export const RacesCtrlApiFetchParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRaces(options: any = {}): FetchArgs {
            const localVarPath = `/api/races`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * RacesCtrlApi - functional programming interface
 * @export
 */
export const RacesCtrlApiFp = function(configuration?: Configuration) {
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRaces(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Array<RaceRow>> {
            const localVarFetchArgs = RacesCtrlApiFetchParamCreator(configuration).getAllRaces(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
    }
};

/**
 * RacesCtrlApi - factory interface
 * @export
 */
export const RacesCtrlApiFactory = function (configuration?: Configuration, fetch?: FetchAPI, basePath?: string) {
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRaces(options?: any) {
            return RacesCtrlApiFp(configuration).getAllRaces(options)(fetch, basePath);
        },
    };
};

/**
 * RacesCtrlApi - object-oriented interface
 * @export
 * @class RacesCtrlApi
 * @extends {BaseAPI}
 */
export class RacesCtrlApi extends BaseAPI {
    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RacesCtrlApi
     */
    public getAllRaces(options?: any) {
        return RacesCtrlApiFp(this.configuration).getAllRaces(options)(this.fetch, this.basePath);
    }

}

