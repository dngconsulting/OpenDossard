import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Payload de `POST /competitions/:competitionId/push` : message envoyé par
 * l'organisateur aux users ayant starré l'épreuve. Le titre du push n'est
 * pas saisi — c'est toujours le nom de l'épreuve.
 */
export class SendCompetitionPushDto {
  @ApiProperty({ description: 'Corps du message push.', maxLength: 500 })
  // Trim AVANT validation : un message composé d'espaces devient '' et est
  // rejeté par IsNotEmpty (sinon push avec corps visuellement vide).
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : (value as unknown)))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;
}
