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

/**
 * 
 * @export
 * @enum {string}
 */
export enum CompetitionEntityCompetitionTypeEnum {
    CX = 'CX',
    ROUTE = 'ROUTE',
    VTT = 'VTT',
    AUTRE = 'AUTRE'
}

export function CompetitionEntityCompetitionTypeEnumFromJSON(json: any): CompetitionEntityCompetitionTypeEnum {
    return CompetitionEntityCompetitionTypeEnumFromJSONTyped(json, false);
}

export function CompetitionEntityCompetitionTypeEnumFromJSONTyped(json: any, ignoreDiscriminator: boolean): CompetitionEntityCompetitionTypeEnum {
    return json as CompetitionEntityCompetitionTypeEnum;
}

export function CompetitionEntityCompetitionTypeEnumToJSON(value?: CompetitionEntityCompetitionTypeEnum | null): any {
    return value as any;
}

