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
    CompetitionEntity,
    CompetitionEntityFromJSON,
    CompetitionEntityToJSON,
    CompetitionFilter,
    CompetitionFilterFromJSON,
    CompetitionFilterToJSON,
    CompetitionReorganize,
    CompetitionReorganizeFromJSON,
    CompetitionReorganizeToJSON,
} from '../models';

export interface GetCompetitionRequest {
    id: string;
}

export interface GetCompetitionsByFilterRequest {
    competitionFilter: CompetitionFilter;
}

export interface ReorganizeRequest {
    competitionReorganize: CompetitionReorganize;
}

export interface SaveInfoGenRequest {
    competitionEntity: CompetitionEntity;
}

/**
 * no description
 */
export class CompetitionAPIApi extends runtime.BaseAPI {

    /**
     * Recherche une épreuve par son identifiant
     * Recherche d\'une épreuve par ID
     */
    async getCompetitionRaw(requestParameters: GetCompetitionRequest): Promise<runtime.ApiResponse<CompetitionEntity>> {
        if (requestParameters.id === null || requestParameters.id === undefined) {
            throw new runtime.RequiredError('id','Required parameter requestParameters.id was null or undefined when calling getCompetition.');
        }

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
            path: `/api/competition/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters.id))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        });

        return new runtime.JSONApiResponse(response, (jsonValue) => CompetitionEntityFromJSON(jsonValue));
    }

    /**
     * Recherche une épreuve par son identifiant
     * Recherche d\'une épreuve par ID
     */
    async getCompetition(requestParameters: GetCompetitionRequest): Promise<CompetitionEntity> {
        const response = await this.getCompetitionRaw(requestParameters);
        return await response.value();
    }

    /**
     * Recherche toutes les compétitions disponibles dans le filtre
     * Rechercher Toutes les compétitions correspondant au filtre passé en paramètre
     */
    async getCompetitionsByFilterRaw(requestParameters: GetCompetitionsByFilterRequest): Promise<runtime.ApiResponse<Array<CompetitionEntity>>> {
        if (requestParameters.competitionFilter === null || requestParameters.competitionFilter === undefined) {
            throw new runtime.RequiredError('competitionFilter','Required parameter requestParameters.competitionFilter was null or undefined when calling getCompetitionsByFilter.');
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
            path: `/api/competition`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CompetitionFilterToJSON(requestParameters.competitionFilter),
        });

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(CompetitionEntityFromJSON));
    }

    /**
     * Recherche toutes les compétitions disponibles dans le filtre
     * Rechercher Toutes les compétitions correspondant au filtre passé en paramètre
     */
    async getCompetitionsByFilter(requestParameters: GetCompetitionsByFilterRequest): Promise<Array<CompetitionEntity>> {
        const response = await this.getCompetitionsByFilterRaw(requestParameters);
        return await response.value();
    }

    /**
     * Réorganisation des courses
     */
    async reorganizeRaw(requestParameters: ReorganizeRequest): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.competitionReorganize === null || requestParameters.competitionReorganize === undefined) {
            throw new runtime.RequiredError('competitionReorganize','Required parameter requestParameters.competitionReorganize was null or undefined when calling reorganize.');
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
            path: `/api/competition/reorganize`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CompetitionReorganizeToJSON(requestParameters.competitionReorganize),
        });

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Réorganisation des courses
     */
    async reorganize(requestParameters: ReorganizeRequest): Promise<void> {
        await this.reorganizeRaw(requestParameters);
    }

    /**
     * Sauvegarde les informations générales d\'une épreuve (Speaker, Aboyeur, Commissaires,...)
     */
    async saveInfoGenRaw(requestParameters: SaveInfoGenRequest): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.competitionEntity === null || requestParameters.competitionEntity === undefined) {
            throw new runtime.RequiredError('competitionEntity','Required parameter requestParameters.competitionEntity was null or undefined when calling saveInfoGen.');
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
            path: `/api/competition/saveInfoGen`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CompetitionEntityToJSON(requestParameters.competitionEntity),
        });

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Sauvegarde les informations générales d\'une épreuve (Speaker, Aboyeur, Commissaires,...)
     */
    async saveInfoGen(requestParameters: SaveInfoGenRequest): Promise<void> {
        await this.saveInfoGenRaw(requestParameters);
    }

}
