import { LicenceEntity } from "../entity/licence.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FederationEntity } from "src/entity/federation.entity";
import { Category, CompetitionType } from "src/entity/competition.entity";
import { PricingInfo } from "src/entity/pricing-info";
import { CompetitionInfo } from "src/entity/competition-info";
import { LinkInfo } from "../entity/link-info";

export class ClubRow {
  public id?: number;
  public longName?: string;
  public dept?: string;
  public shortName?: string;
}

export class ChallengeDTO {
  public id?: number;
  public name?: string;
  public description?: string;
  public competitionIds?: number[];
  public active?: boolean;
  public reglement?: string;
  public competitionType?: string;
}

export class CompetitionReorganize {
  public competitionId?: number;
  public races?: string[];
}

export class CompetitionIdsDTO {
  public ids?: number[];
}

export class RaceRow {
  public id?: number;
  public raceCode?: string;
  public birthYear?: string;
  public riderNumber?: number;
  public surclassed?: boolean;
  public licenceNumber?: string;
  public licenceId?: string;
  public licenceDept?: string;
  public name?: string;
  public riderName?: string;
  public club?: string;
  public catev?: string;
  public catea?: string;
  public dept?: string;
  public fede?: string;
  public gender?: string;
  public rankingScratch: number;
  public comment: string;
  public competitionId: number;
  public competitionName?: string;
  public competitionType?: string;
  public competitionRaces?: string[];
  @ApiPropertyOptional({ type: "string", format: "date-time" })
  public competitionDate?: Date;
  public sprintchallenge?: boolean;
  public chrono?: string;
  public tours?: number;
}

export class ChallengeRaceRow {
  public name?: string;
  public firstName?: string;
  public competitionName?: string;
  public club?: string;
  public catev?: string;
  public catea?: string;
  public dept?: string;
  public fede?: string;
  public gender?: string;
  public rankingScratch?: number;
  public competitionId?: number;
  public comment?: string;
  public eventDate?: string;
  public sprintchallenge?: boolean;
  public licenceId?: string;
  public ptsRace?: number;
  public nbParticipants?: number;
  public explanation?: string;
}

export class ChallengeRider {
  public licenceId?: string;
  public name?: string;
  public gender?: string;
  public firstName?: string;
  public catev?: string;
  public catea?: string;
  public challengeRaceRows?: ChallengeRaceRow[];
  public ptsAllRaces?: number;
  public currentLicenceCatev?: string;
  public currentLicenceCatea?: string;
  public currentClub?: string;
  public explanation?: string;
}

export class RaceCreate {
  public competitionId?: number;
  public licenceId?: number;
  public riderNumber?: number;
  public raceCode?: string;
  public catev?: string;
  public catea?: string;
  public club?: string;
  public rankingScratch?: number;
}

export class RaceNbRider {
  public count?: number;
  public raceCode?: string;
  public name?: string;
  @ApiProperty({ type: "string", format: "date-time" })
  public date?: Date;
  public fede?: string;
}

export class Filter {
  name?: string;
  value?: string;
}

export class RaceFilter {
  competitionIds?: number[];
  gender?: string;
  catev?: string;
}

export class LicencesPage {
  data?: LicenceEntity[];
  page?: number;
  totalCount?: number;
}

export class Search {
  currentPage?: number;
  pageSize?: number;
  @ApiProperty({ type: "string" })
  orderDirection?: "ASC" | "DESC";
  orderBy?: string;
  search?: string;
  filters?: Filter[];
}

export class CompetitionFilter {
  competitionTypes?: string[];
  fedes?: string[];
  depts?: Departement[];
  openedToOtherFede?: boolean;
  openedNL?: boolean;
  displayFuture?: boolean;
  displayPast?: boolean;
  displaySince?: number;
  startDate?: string;
  endDate?: string;
}

export class UpdateToursParams {
  raceId: number;
  tours?: number;
}

export class Departement {
  departmentCode: string;
  departmentName: string;
  regionCode: string;
  regionName: string;
}

export class CompetitionCreate {
  id?: number;
  name: string;
  competitionType?: CompetitionType;
  @ApiProperty({ enum: FederationEntity, enumName: "FedeEnum" })
  fede?: FederationEntity;
  categories?: Category[];
  races?: string[];
  eventDate: Date;
  zipCode: string;
  clubId: number;
  info?: string;
  competitionInfo?: CompetitionInfo[];
  lapNumber?: string;
  circuitLength?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  facebook?: string;
  latitude?: number;
  longitude?: number;
  pricing?: PricingInfo[];
  startDate?: string;
  isOpenedToOtherFede?: boolean;
  isOpenedToNL?: boolean;
  avecChrono?: boolean;
  observations?: string;
  localisation?: string;
  gpsCoordinates?: string;
  contactName?: string;
  commissaires?: string;
  speaker?: string;
  aboyeur?: string;
  feedback?: string;
  photoUrls?: LinkInfo[];
  rankingUrls?: LinkInfo[];
  isValidResults?: boolean;
  dept?: string;
}

export class FedeDeptParamDTO {
  fede?: string;
  dept?: string;
}
