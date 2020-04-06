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


import * as runtime from '../runtime';
import {
    ClubEntity,
    ClubEntityFromJSON,
    ClubEntityToJSON,
    ClubRow,
    ClubRowFromJSON,
    ClubRowToJSON,
} from '../models';

export interface CreateClubRequest {
    clubEntity: ClubEntity;
}

/**
 * no description
 */
export class ClubAPIApi extends runtime.BaseAPI {

    /**
     * Cree un nouveau club
     */
    async createClubRaw(requestParameters: CreateClubRequest): Promise<runtime.ApiResponse<ClubEntity>> {
        if (requestParameters.clubEntity === null || requestParameters.clubEntity === undefined) {
            throw new runtime.RequiredError('clubEntity','Required parameter requestParameters.clubEntity was null or undefined when calling createClub.');
        }

        const queryParameters: runtime.HTTPQuery = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = typeof token === 'function' ? token("bearerAuth", []) : token;

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/clubs`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: ClubEntityToJSON(requestParameters.clubEntity),
        });

        return new runtime.JSONApiResponse(response, (jsonValue) => ClubEntityFromJSON(jsonValue));
    }

    /**
     * Cree un nouveau club
     */
    async createClub(requestParameters: CreateClubRequest): Promise<ClubEntity> {
        const response = await this.createClubRaw(requestParameters);
        return await response.value();
    }

    /**
     * Renvoie la liste de tous les clubs
     * Rechercher tous les clubs
     */
    async getAllClubsRaw(): Promise<runtime.ApiResponse<Array<ClubRow>>> {
        const queryParameters: runtime.HTTPQuery = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = typeof token === 'function' ? token("bearerAuth", []) : token;

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/clubs`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        });

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(ClubRowFromJSON));
    }

    /**
     * Renvoie la liste de tous les clubs
     * Rechercher tous les clubs
     */
    async getAllClubs(): Promise<Array<ClubRow>> {
        const response = await this.getAllClubsRaw();
        return await response.value();
    }

}
