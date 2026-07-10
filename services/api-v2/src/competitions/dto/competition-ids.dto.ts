import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

/**
 * Récupération groupée de compétitions à partir d'une liste d'IDs
 * (ex. les competitionIds d'un challenge).
 */
export class CompetitionIdsDto {
  @ApiProperty({ description: 'IDs des compétitions à récupérer', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids: number[];
}
