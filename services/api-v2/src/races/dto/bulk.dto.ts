import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsString } from 'class-validator';

/**
 * Désengagement groupé (suppression atomique de plusieurs lignes `race`).
 */
export class BulkDeleteRacesDto {
  @ApiProperty({ description: 'IDs des engagements à supprimer', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids: number[];

  @ApiProperty({ description: 'ID de la compétition (borne le périmètre de suppression)' })
  @IsInt()
  competitionId: number;
}

/**
 * Déclassement groupé (retrait atomique du classement + une seule
 * renumérotation de la course).
 */
export class BulkRemoveRankingDto {
  @ApiProperty({ description: 'IDs des engagements à déclasser', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids: number[];

  @ApiProperty({ description: 'Code de la course' })
  @IsString()
  raceCode: string;

  @ApiProperty({ description: 'ID de la compétition' })
  @IsInt()
  competitionId: number;
}
