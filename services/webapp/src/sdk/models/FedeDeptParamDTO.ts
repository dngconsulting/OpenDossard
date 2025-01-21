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
/**
 * 
 * @export
 * @interface FedeDeptParamDTO
 */
export interface FedeDeptParamDTO {
    /**
     * 
     * @type {string}
     * @memberof FedeDeptParamDTO
     */
    fede?: string;
    /**
     * 
     * @type {string}
     * @memberof FedeDeptParamDTO
     */
    dept?: string;
}

export function FedeDeptParamDTOFromJSON(json: any): FedeDeptParamDTO {
    return FedeDeptParamDTOFromJSONTyped(json, false);
}

export function FedeDeptParamDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): FedeDeptParamDTO {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'fede': !exists(json, 'fede') ? undefined : json['fede'],
        'dept': !exists(json, 'dept') ? undefined : json['dept'],
    };
}

export function FedeDeptParamDTOToJSON(value?: FedeDeptParamDTO | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'fede': value.fede,
        'dept': value.dept,
    };
}


