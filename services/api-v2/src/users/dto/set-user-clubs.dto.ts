import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

/**
 * Body de `PUT /users/:id/clubs` — set complet de l'ensemble des clubs liés.
 * Idempotent : envoyer deux fois la même liste = no-op au 2e appel.
 */
export class SetUserClubsDto {
  @ApiProperty({
    type: [Number],
    description:
      "Liste complète des clubIds à associer au user. Remplace l'ensemble existant. Liste vide = délier de tous les clubs.",
    example: [12, 45, 78],
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  clubIds: number[];
}
