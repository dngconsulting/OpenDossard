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
    CompetitionInfo,
    CompetitionInfoFromJSON,
    CompetitionInfoFromJSONTyped,
    CompetitionInfoToJSON,
    FedeEnum,
    FedeEnumFromJSON,
    FedeEnumFromJSONTyped,
    FedeEnumToJSON,
    PricingInfo,
    PricingInfoFromJSON,
    PricingInfoFromJSONTyped,
    PricingInfoToJSON,
} from './';

/**
 * 
 * @export
 * @interface CompetitionCreate
 */
export interface CompetitionCreate {
    /**
     * 
     * @type {FedeEnum}
     * @memberof CompetitionCreate
     */
    fede?: FedeEnum;
    /**
     * 
     * @type {number}
     * @memberof CompetitionCreate
     */
    id?: number;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    competitionType?: CompetitionCreateCompetitionTypeEnum;
    /**
     * 
     * @type {Array<string>}
     * @memberof CompetitionCreate
     */
    categories?: Array<CompetitionCreateCategoriesEnum>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CompetitionCreate
     */
    races?: Array<string>;
    /**
     * 
     * @type {Date}
     * @memberof CompetitionCreate
     */
    eventDate: Date;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    zipCode: string;
    /**
     * 
     * @type {number}
     * @memberof CompetitionCreate
     */
    club: number;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    info?: string;
    /**
     * 
     * @type {Array<CompetitionInfo>}
     * @memberof CompetitionCreate
     */
    competitionInfo?: Array<CompetitionInfo>;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    lapNumber?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    longueurCircuit?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    contactPhone?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    contactEmail?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    siteweb?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    facebook?: string;
    /**
     * 
     * @type {number}
     * @memberof CompetitionCreate
     */
    latitude?: number;
    /**
     * 
     * @type {number}
     * @memberof CompetitionCreate
     */
    longitude?: number;
    /**
     * 
     * @type {Array<PricingInfo>}
     * @memberof CompetitionCreate
     */
    pricing?: Array<PricingInfo>;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    startDate?: string;
    /**
     * 
     * @type {boolean}
     * @memberof CompetitionCreate
     */
    openedToOtherFede?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof CompetitionCreate
     */
    openedNL?: boolean;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    observations?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    lieuDossard?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    lieuDossardGPS?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    contactName?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    commissaires?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    speaker?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    aboyeur?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    feedback?: string;
    /**
     * 
     * @type {boolean}
     * @memberof CompetitionCreate
     */
    resultsValidated?: boolean;
    /**
     * 
     * @type {string}
     * @memberof CompetitionCreate
     */
    dept?: string;
}

export function CompetitionCreateFromJSON(json: any): CompetitionCreate {
    return CompetitionCreateFromJSONTyped(json, false);
}

export function CompetitionCreateFromJSONTyped(json: any, ignoreDiscriminator: boolean): CompetitionCreate {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'fede': !exists(json, 'fede') ? undefined : FedeEnumFromJSON(json['fede']),
        'id': !exists(json, 'id') ? undefined : json['id'],
        'name': json['name'],
        'competitionType': !exists(json, 'competitionType') ? undefined : json['competitionType'],
        'categories': !exists(json, 'categories') ? undefined : json['categories'],
        'races': !exists(json, 'races') ? undefined : json['races'],
        'eventDate': (new Date(json['eventDate'])),
        'zipCode': json['zipCode'],
        'club': json['club'],
        'info': !exists(json, 'info') ? undefined : json['info'],
        'competitionInfo': !exists(json, 'competitionInfo') ? undefined : ((json['competitionInfo'] as Array<any>).map(CompetitionInfoFromJSON)),
        'lapNumber': !exists(json, 'lapNumber') ? undefined : json['lapNumber'],
        'longueurCircuit': !exists(json, 'longueurCircuit') ? undefined : json['longueurCircuit'],
        'contactPhone': !exists(json, 'contactPhone') ? undefined : json['contactPhone'],
        'contactEmail': !exists(json, 'contactEmail') ? undefined : json['contactEmail'],
        'siteweb': !exists(json, 'siteweb') ? undefined : json['siteweb'],
        'facebook': !exists(json, 'facebook') ? undefined : json['facebook'],
        'latitude': !exists(json, 'latitude') ? undefined : json['latitude'],
        'longitude': !exists(json, 'longitude') ? undefined : json['longitude'],
        'pricing': !exists(json, 'pricing') ? undefined : ((json['pricing'] as Array<any>).map(PricingInfoFromJSON)),
        'startDate': !exists(json, 'startDate') ? undefined : json['startDate'],
        'openedToOtherFede': !exists(json, 'openedToOtherFede') ? undefined : json['openedToOtherFede'],
        'openedNL': !exists(json, 'openedNL') ? undefined : json['openedNL'],
        'observations': !exists(json, 'observations') ? undefined : json['observations'],
        'lieuDossard': !exists(json, 'lieuDossard') ? undefined : json['lieuDossard'],
        'lieuDossardGPS': !exists(json, 'lieuDossardGPS') ? undefined : json['lieuDossardGPS'],
        'contactName': !exists(json, 'contactName') ? undefined : json['contactName'],
        'commissaires': !exists(json, 'commissaires') ? undefined : json['commissaires'],
        'speaker': !exists(json, 'speaker') ? undefined : json['speaker'],
        'aboyeur': !exists(json, 'aboyeur') ? undefined : json['aboyeur'],
        'feedback': !exists(json, 'feedback') ? undefined : json['feedback'],
        'resultsValidated': !exists(json, 'results_validated') ? undefined : json['results_validated'],
        'dept': !exists(json, 'dept') ? undefined : json['dept'],
    };
}

export function CompetitionCreateToJSON(value?: CompetitionCreate | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'fede': FedeEnumToJSON(value.fede),
        'id': value.id,
        'name': value.name,
        'competitionType': value.competitionType,
        'categories': value.categories,
        'races': value.races,
        'eventDate': (value.eventDate.toISOString()),
        'zipCode': value.zipCode,
        'club': value.club,
        'info': value.info,
        'competitionInfo': value.competitionInfo === undefined ? undefined : ((value.competitionInfo as Array<any>).map(CompetitionInfoToJSON)),
        'lapNumber': value.lapNumber,
        'longueurCircuit': value.longueurCircuit,
        'contactPhone': value.contactPhone,
        'contactEmail': value.contactEmail,
        'siteweb': value.siteweb,
        'facebook': value.facebook,
        'latitude': value.latitude,
        'longitude': value.longitude,
        'pricing': value.pricing === undefined ? undefined : ((value.pricing as Array<any>).map(PricingInfoToJSON)),
        'startDate': value.startDate,
        'openedToOtherFede': value.openedToOtherFede,
        'openedNL': value.openedNL,
        'observations': value.observations,
        'lieuDossard': value.lieuDossard,
        'lieuDossardGPS': value.lieuDossardGPS,
        'contactName': value.contactName,
        'commissaires': value.commissaires,
        'speaker': value.speaker,
        'aboyeur': value.aboyeur,
        'feedback': value.feedback,
        'results_validated': value.resultsValidated,
        'dept': value.dept,
    };
}

/**
* @export
* @enum {string}
*/
export enum CompetitionCreateCompetitionTypeEnum {
    CX = 'CX',
    ROUTE = 'ROUTE',
    VTT = 'VTT',
    AUTRE = 'AUTRE'
}
/**
* @export
* @enum {string}
*/
export enum CompetitionCreateCategoriesEnum {
    _1ere = '1ere',
    _2eme = '2eme',
    _3eme = '3eme',
    _4eme = '4eme',
    _5eme = '5eme',
    Cadets = 'Cadets',
    Minimes = 'Minimes',
    Feminines = 'Feminines',
    Toutes = 'Toutes'
}

