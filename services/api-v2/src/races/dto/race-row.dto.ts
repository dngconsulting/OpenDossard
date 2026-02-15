import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO représentant une ligne d'engagement/résultat enrichie
 * avec les informations du coureur et de la compétition
 */
export class RaceRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  raceCode: string;

  @ApiProperty()
  catev: string;

  @ApiPropertyOptional()
  catea?: string;

  @ApiPropertyOptional()
  chrono?: string;

  @ApiPropertyOptional()
  tours?: number;

  @ApiProperty()
  riderNumber: number;

  @ApiPropertyOptional()
  rankingScratch?: number;

  @ApiPropertyOptional()
  numberMin?: number;

  @ApiPropertyOptional()
  numberMax?: number;

  @ApiProperty()
  licenceId: number;

  @ApiPropertyOptional()
  licenceNumber?: string;

  @ApiPropertyOptional()
  sprintchallenge?: boolean;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty()
  competitionId: number;

  @ApiPropertyOptional()
  competitionName?: string;

  @ApiPropertyOptional()
  competitionDate?: Date;

  @ApiPropertyOptional()
  competitionType?: string;

  @ApiPropertyOptional()
  competitionRaces?: string[];

  @ApiProperty({ description: 'Nom complet du coureur (NOM Prénom)' })
  name: string;

  @ApiPropertyOptional({ description: 'Nom du coureur seul' })
  riderName?: string;

  @ApiPropertyOptional()
  club?: string;

  @ApiPropertyOptional()
  gender?: string;

  @ApiPropertyOptional()
  dept?: string;

  @ApiPropertyOptional()
  fede?: string;

  @ApiPropertyOptional()
  birthYear?: string;

  @ApiPropertyOptional({ description: 'Coureur surclassé' })
  surclassed?: boolean;
}
