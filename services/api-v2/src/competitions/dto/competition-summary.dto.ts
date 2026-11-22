import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, Matches } from 'class-validator';

import { PaginationDto } from '../../common/dto';
import { CompetitionType, Federation } from '../../common/enums';

/** `a,b,c` → `['a', 'b', 'c']` (valeurs vides ignorées). */
const splitCsv = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    : value;

const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MESSAGE = 'doit être un jour au format AAAA-MM-JJ';

/**
 * Filtres de `GET /competitions/summaries`. Le tri se fait toujours par date
 * (`orderDirection` seul est pris en compte, `orderBy` est ignoré).
 *
 * Les listes arrivent séparées par des virgules. Fédérations et types sont
 * validés contre leurs énumérations : une valeur inconnue donne un 400, au lieu
 * d'une erreur Postgres sur la colonne enum.
 */
export class FilterCompetitionSummariesDto extends PaginationDto {
  @ApiPropertyOptional({ type: String, description: 'Fédérations (séparées par des virgules)' })
  @IsOptional()
  @Transform(splitCsv)
  @IsEnum(Federation, { each: true })
  fedes?: Federation[];

  @ApiPropertyOptional({ type: String, description: "Types d'épreuve (séparés par des virgules)" })
  @IsOptional()
  @Transform(splitCsv)
  @IsEnum(CompetitionType, { each: true })
  competitionTypes?: CompetitionType[];

  @ApiPropertyOptional({ type: String, description: 'Départements (séparés par des virgules)' })
  @IsOptional()
  @Transform(splitCsv)
  @IsString({ each: true })
  depts?: string[];

  @ApiPropertyOptional({ description: 'Premier jour inclus (AAAA-MM-JJ, heure de Paris)' })
  @IsOptional()
  @Matches(DAY_FORMAT, { message: `startDate ${DAY_MESSAGE}` })
  @IsDateString({ strict: true })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Dernier jour inclus (AAAA-MM-JJ, heure de Paris)' })
  @IsOptional()
  @Matches(DAY_FORMAT, { message: `endDate ${DAY_MESSAGE}` })
  @IsDateString({ strict: true })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Uniquement les épreuves ouvertes aux autres fédérations' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  openedToOtherFede?: boolean;
}

/**
 * Résumé d'une épreuve : le strict nécessaire aux listes, au calendrier et à
 * la carte de l'app mobile. La fiche complète se lit par `GET /competitions/:id`.
 *
 * Tout champ ajouté ici alourdit chaque ligne de chaque liste : ne l'étendre
 * que pour une donnée affichée sans ouvrir la fiche.
 */
export class CompetitionSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  eventDate: Date;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Federation })
  fede: Federation;

  @ApiProperty({ enum: CompetitionType })
  competitionType: CompetitionType;

  @ApiProperty()
  zipCode: string;

  @ApiPropertyOptional({ nullable: true })
  dept: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Coordonnées « latitude,longitude »' })
  lieuDossardGPS: string | null;

  @ApiProperty()
  onlineRegistrationEnabled: boolean;
}

/** Colonnes lues en base pour un résumé (aucune autre n'est chargée). */
export const COMPETITION_SUMMARY_FIELDS = [
  'id',
  'eventDate',
  'name',
  'fede',
  'competitionType',
  'zipCode',
  'dept',
  'lieuDossardGPS',
  'onlineRegistrationEnabled',
] as const satisfies readonly (keyof CompetitionSummaryDto)[];
