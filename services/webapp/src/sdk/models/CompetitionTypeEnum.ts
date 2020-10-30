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
export enum CompetitionTypeEnum {
    CX = 'CX',
    ROUTE = 'ROUTE',
    VTT = 'VTT',
    AUTRE = 'AUTRE'
}

export function CompetitionTypeEnumFromJSON(json: any): CompetitionTypeEnum {
    return CompetitionTypeEnumFromJSONTyped(json, false);
}

export function CompetitionTypeEnumFromJSONTyped(json: any, ignoreDiscriminator: boolean): CompetitionTypeEnum {
    return json as CompetitionTypeEnum;
}

export function CompetitionTypeEnumToJSON(value?: CompetitionTypeEnum | null): any {
    return value as any;
}

