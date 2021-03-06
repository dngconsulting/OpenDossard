/* tslint:disable */
/* eslint-disable */
/**
 * Open Dossard
 * Documentation de l\'API Open Dossard
 *
 * The version of the OpenAPI document: 1.0
 * Contact: contact@opendossard.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import {
    LicenceEntity,
    LicenceEntityFromJSON,
    LicenceEntityFromJSONTyped,
    LicenceEntityToJSON,
} from './';

/**
 * 
 * @export
 * @interface LicencesPage
 */
export interface LicencesPage {
    /**
     * 
     * @type {Array<LicenceEntity>}
     * @memberof LicencesPage
     */
    data?: Array<LicenceEntity>;
    /**
     * 
     * @type {number}
     * @memberof LicencesPage
     */
    page?: number;
    /**
     * 
     * @type {number}
     * @memberof LicencesPage
     */
    totalCount?: number;
}

export function LicencesPageFromJSON(json: any): LicencesPage {
    return LicencesPageFromJSONTyped(json, false);
}

export function LicencesPageFromJSONTyped(json: any, ignoreDiscriminator: boolean): LicencesPage {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : ((json['data'] as Array<any>).map(LicenceEntityFromJSON)),
        'page': !exists(json, 'page') ? undefined : json['page'],
        'totalCount': !exists(json, 'totalCount') ? undefined : json['totalCount'],
    };
}

export function LicencesPageToJSON(value?: LicencesPage | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data === undefined ? undefined : ((value.data as Array<any>).map(LicenceEntityToJSON)),
        'page': value.page,
        'totalCount': value.totalCount,
    };
}


