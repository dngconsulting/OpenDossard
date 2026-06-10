import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/**
 * Payload de `POST /favorites` : star d'une épreuve pour le user authentifié
 * (identité lue via `@CurrentUser('id')`, jamais du body).
 */
export class StarCompetitionDto {
  @ApiProperty({ description: 'Identifiant de la compétition à starrer.' })
  @IsInt()
  @IsPositive()
  competitionId: number;
}
