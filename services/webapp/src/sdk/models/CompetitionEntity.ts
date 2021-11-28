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
    ClubEntity,
    ClubEntityFromJSON,
    ClubEntityFromJSONTyped,
    ClubEntityToJSON,
    CompetitionInfo,
    CompetitionInfoFromJSON,
    CompetitionInfoFromJSONTyped,
    CompetitionInfoToJSON,
    FedeEnum,
    FedeEnumFromJSON,
    FedeEnumFromJSONTyped,
    FedeEnumToJSON,
    LinkInfo,
    LinkInfoFromJSON,
    LinkInfoFromJSONTyped,
    LinkInfoToJSON,
    PricingInfo,
    PricingInfoFromJSON,
    PricingInfoFromJSONTyped,
    PricingInfoToJSON,
} from './';

/**
 * 
 * @export
 * @interface CompetitionEntity
 */
export interface CompetitionEntity {
    /**
     * 
     * @type {Date}
     * @memberof CompetitionEntity
     */
    eventDate: Date;
    /**
     * 
     * @type {FedeEnum}
     * @memberof CompetitionEntity
     */
    fede: FedeEnum;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    competitionType: CompetitionEntityCompetitionTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof CompetitionEntity
     */
    id: number;
    /**
     * 
     * @type {ClubEntity}
     * @memberof CompetitionEntity
     */
    club: ClubEntity;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    zipCode: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    info?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof CompetitionEntity
     */
    categories: Array<CompetitionEntityCategoriesEnum>;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    observations?: string;
    /**
     * 
     * @type {Array<PricingInfo>}
     * @memberof CompetitionEntity
     */
    pricing?: Array<PricingInfo>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CompetitionEntity
     */
    races?: Array<string>;
    /**
     * 
     * @type {Array<CompetitionInfo>}
     * @memberof CompetitionEntity
     */
    competitionInfo?: Array<CompetitionInfo>;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    lieuDossard?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    lieuDossardGPS: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    longueurCircuit?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    siteweb?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    facebook?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    contactEmail?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    contactPhone?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    contactName?: string;
    /**
     * 
     * @type {boolean}
     * @memberof CompetitionEntity
     */
    openedToOtherFede?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof CompetitionEntity
     */
    openedNL?: boolean;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    dept?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    rankingUrl?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    commissaires?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    speaker?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    aboyeur?: string;
    /**
     * 
     * @type {string}
     * @memberof CompetitionEntity
     */
    feedback?: string;
    /**
     * 
     * @type {boolean}
     * @memberof CompetitionEntity
     */
    resultsValidated?: boolean;
    /**
     * 
     * @type {Array<LinkInfo>}
     * @memberof CompetitionEntity
     */
    photoUrls?: Array<LinkInfo>;
    /**
     * 
     * @type {Array<LinkInfo>}
     * @memberof CompetitionEntity
     */
    rankingUrls?: Array<LinkInfo>;
}

export function CompetitionEntityFromJSON(json: any): CompetitionEntity {
    return CompetitionEntityFromJSONTyped(json, false);
}

export function CompetitionEntityFromJSONTyped(json: any, ignoreDiscriminator: boolean): CompetitionEntity {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'eventDate': (new Date(json['eventDate'])),
        'fede': FedeEnumFromJSON(json['fede']),
        'competitionType': json['competitionType'],
        'id': json['id'],
        'club': ClubEntityFromJSON(json['club']),
        'name': json['name'],
        'zipCode': json['zipCode'],
        'info': !exists(json, 'info') ? undefined : json['info'],
        'categories': json['categories'],
        'observations': !exists(json, 'observations') ? undefined : json['observations'],
        'pricing': !exists(json, 'pricing') ? undefined : ((json['pricing'] as Array<any>).map(PricingInfoFromJSON)),
        'races': !exists(json, 'races') ? undefined : json['races'],
        'competitionInfo': !exists(json, 'competitionInfo') ? undefined : ((json['competitionInfo'] as Array<any>).map(CompetitionInfoFromJSON)),
        'lieuDossard': !exists(json, 'lieuDossard') ? undefined : json['lieuDossard'],
        'lieuDossardGPS': json['lieuDossardGPS'],
        'longueurCircuit': !exists(json, 'longueurCircuit') ? undefined : json['longueurCircuit'],
        'siteweb': !exists(json, 'siteweb') ? undefined : json['siteweb'],
        'facebook': !exists(json, 'facebook') ? undefined : json['facebook'],
        'contactEmail': !exists(json, 'contactEmail') ? undefined : json['contactEmail'],
        'contactPhone': !exists(json, 'contactPhone') ? undefined : json['contactPhone'],
        'contactName': !exists(json, 'contactName') ? undefined : json['contactName'],
        'openedToOtherFede': !exists(json, 'openedToOtherFede') ? undefined : json['openedToOtherFede'],
        'openedNL': !exists(json, 'openedNL') ? undefined : json['openedNL'],
        'dept': !exists(json, 'dept') ? undefined : json['dept'],
        'rankingUrl': !exists(json, 'rankingUrl') ? undefined : json['rankingUrl'],
        'commissaires': !exists(json, 'commissaires') ? undefined : json['commissaires'],
        'speaker': !exists(json, 'speaker') ? undefined : json['speaker'],
        'aboyeur': !exists(json, 'aboyeur') ? undefined : json['aboyeur'],
        'feedback': !exists(json, 'feedback') ? undefined : json['feedback'],
        'resultsValidated': !exists(json, 'resultsValidated') ? undefined : json['resultsValidated'],
        'photoUrls': !exists(json, 'photoUrls') ? undefined : ((json['photoUrls'] as Array<any>).map(LinkInfoFromJSON)),
        'rankingUrls': !exists(json, 'rankingUrls') ? undefined : ((json['rankingUrls'] as Array<any>).map(LinkInfoFromJSON)),
    };
}

export function CompetitionEntityToJSON(value?: CompetitionEntity | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'eventDate': (value.eventDate.toISOString()),
        'fede': FedeEnumToJSON(value.fede),
        'competitionType': value.competitionType,
        'id': value.id,
        'club': ClubEntityToJSON(value.club),
        'name': value.name,
        'zipCode': value.zipCode,
        'info': value.info,
        'categories': value.categories,
        'observations': value.observations,
        'pricing': value.pricing === undefined ? undefined : ((value.pricing as Array<any>).map(PricingInfoToJSON)),
        'races': value.races,
        'competitionInfo': value.competitionInfo === undefined ? undefined : ((value.competitionInfo as Array<any>).map(CompetitionInfoToJSON)),
        'lieuDossard': value.lieuDossard,
        'lieuDossardGPS': value.lieuDossardGPS,
        'longueurCircuit': value.longueurCircuit,
        'siteweb': value.siteweb,
        'facebook': value.facebook,
        'contactEmail': value.contactEmail,
        'contactPhone': value.contactPhone,
        'contactName': value.contactName,
        'openedToOtherFede': value.openedToOtherFede,
        'openedNL': value.openedNL,
        'dept': value.dept,
        'rankingUrl': value.rankingUrl,
        'commissaires': value.commissaires,
        'speaker': value.speaker,
        'aboyeur': value.aboyeur,
        'feedback': value.feedback,
        'resultsValidated': value.resultsValidated,
        'photoUrls': value.photoUrls === undefined ? undefined : ((value.photoUrls as Array<any>).map(LinkInfoToJSON)),
        'rankingUrls': value.rankingUrls === undefined ? undefined : ((value.rankingUrls as Array<any>).map(LinkInfoToJSON)),
    };
}

/**
* @export
* @enum {string}
*/
export enum CompetitionEntityCompetitionTypeEnum {
    CX = 'CX',
    ROUTE = 'ROUTE',
    VTT = 'VTT',
    AUTRE = 'AUTRE'
}
/**
* @export
* @enum {string}
*/
export enum CompetitionEntityCategoriesEnum {
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


