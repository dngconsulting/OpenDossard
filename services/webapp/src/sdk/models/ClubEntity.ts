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
    FedeEnum,
    FedeEnumFromJSON,
    FedeEnumFromJSONTyped,
    FedeEnumToJSON,
} from './';

/**
 * 
 * @export
 * @interface ClubEntity
 */
export interface ClubEntity {
    /**
     * 
     * @type {FedeEnum}
     * @memberof ClubEntity
     */
    fede: FedeEnum;
    /**
     * 
     * @type {number}
     * @memberof ClubEntity
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof ClubEntity
     */
    shortName: string;
    /**
     * 
     * @type {string}
     * @memberof ClubEntity
     */
    dept: string;
    /**
     * 
     * @type {string}
     * @memberof ClubEntity
     */
    longName: string;
    /**
     * 
     * @type {string}
     * @memberof ClubEntity
     */
    elicenceName: string;
}

export function ClubEntityFromJSON(json: any): ClubEntity {
    return ClubEntityFromJSONTyped(json, false);
}

export function ClubEntityFromJSONTyped(json: any, ignoreDiscriminator: boolean): ClubEntity {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'fede': FedeEnumFromJSON(json['fede']),
        'id': json['id'],
        'shortName': json['shortName'],
        'dept': json['dept'],
        'longName': json['longName'],
        'elicenceName': json['elicenceName'],
    };
}

export function ClubEntityToJSON(value?: ClubEntity | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'fede': FedeEnumToJSON(value.fede),
        'id': value.id,
        'shortName': value.shortName,
        'dept': value.dept,
        'longName': value.longName,
        'elicenceName': value.elicenceName,
    };
}


