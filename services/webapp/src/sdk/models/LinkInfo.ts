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
 * @interface LinkInfo
 */
export interface LinkInfo {
    /**
     * 
     * @type {string}
     * @memberof LinkInfo
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof LinkInfo
     */
    link: string;
}

export function LinkInfoFromJSON(json: any): LinkInfo {
    return LinkInfoFromJSONTyped(json, false);
}

export function LinkInfoFromJSONTyped(json: any, ignoreDiscriminator: boolean): LinkInfo {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'label': json['label'],
        'link': json['link'],
    };
}

export function LinkInfoToJSON(value?: LinkInfo | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'label': value.label,
        'link': value.link,
    };
}

