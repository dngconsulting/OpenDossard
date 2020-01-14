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
     * @type {string}
     * @memberof RaceRow
     */
    birthYear?: string;
    /**
     * 
     * @type {number}
     * @memberof RaceRow
     */
    riderNumber?: number;
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
    licenceId?: string;
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
    riderName?: string;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    club?: string;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    catev?: string;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    catea?: string;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    fede?: string;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    gender?: string;
    /**
     * 
     * @type {number}
     * @memberof RaceRow
     */
    rankingScratch: number;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    comment: string;
    /**
     * 
     * @type {number}
     * @memberof RaceRow
     */
    competitionId: number;
    /**
     * 
     * @type {string}
     * @memberof RaceRow
     */
    competitionName?: string;
    /**
     * 
     * @type {Date}
     * @memberof RaceRow
     */
    competitionDate?: Date;
    /**
     * 
     * @type {boolean}
     * @memberof RaceRow
     */
    sprintchallenge?: boolean;
}

export function RaceRowFromJSON(json: any): RaceRow {
    return RaceRowFromJSONTyped(json, false);
}

export function RaceRowFromJSONTyped(json: any, ignoreDiscriminator: boolean): RaceRow {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
        'raceCode': !exists(json, 'raceCode') ? undefined : json['raceCode'],
        'birthYear': !exists(json, 'birthYear') ? undefined : json['birthYear'],
        'riderNumber': !exists(json, 'riderNumber') ? undefined : json['riderNumber'],
        'surclassed': !exists(json, 'surclassed') ? undefined : json['surclassed'],
        'licenceNumber': !exists(json, 'licenceNumber') ? undefined : json['licenceNumber'],
        'licenceId': !exists(json, 'licenceId') ? undefined : json['licenceId'],
        'name': !exists(json, 'name') ? undefined : json['name'],
        'riderName': !exists(json, 'riderName') ? undefined : json['riderName'],
        'club': !exists(json, 'club') ? undefined : json['club'],
        'catev': !exists(json, 'catev') ? undefined : json['catev'],
        'catea': !exists(json, 'catea') ? undefined : json['catea'],
        'fede': !exists(json, 'fede') ? undefined : json['fede'],
        'gender': !exists(json, 'gender') ? undefined : json['gender'],
        'rankingScratch': json['rankingScratch'],
        'comment': json['comment'],
        'competitionId': json['competitionId'],
        'competitionName': !exists(json, 'competitionName') ? undefined : json['competitionName'],
        'competitionDate': !exists(json, 'competitionDate') ? undefined : (new Date(json['competitionDate'])),
        'sprintchallenge': !exists(json, 'sprintchallenge') ? undefined : json['sprintchallenge'],
    };
}

export function RaceRowToJSON(value?: RaceRow | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'raceCode': value.raceCode,
        'birthYear': value.birthYear,
        'riderNumber': value.riderNumber,
        'surclassed': value.surclassed,
        'licenceNumber': value.licenceNumber,
        'licenceId': value.licenceId,
        'name': value.name,
        'riderName': value.riderName,
        'club': value.club,
        'catev': value.catev,
        'catea': value.catea,
        'fede': value.fede,
        'gender': value.gender,
        'rankingScratch': value.rankingScratch,
        'comment': value.comment,
        'competitionId': value.competitionId,
        'competitionName': value.competitionName,
        'competitionDate': value.competitionDate === undefined ? undefined : (value.competitionDate.toISOString()),
        'sprintchallenge': value.sprintchallenge,
    };
}


