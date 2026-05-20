import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/**
 * Payload de `POST /helloasso/oauth/authorize`.
 *
 * `originClubId` est **obligatoire** depuis le lot 3 du modèle d'autorisation
 * scopé : c'est le club qu'on cherche à lier. Le backend vérifie que le user
 * a effectivement le droit sur ce club (`assertClubAccess`) AVANT de monter
 * la mire HelloAsso. Et au callback, on s'assure que le slug renvoyé par
 * HelloAsso matche bien ce même `originClubId` — protection contre le
 * scénario D1 (re-liaison silencieuse vers une orga frauduleuse).
 */
export class AuthorizeRequestDto {
  @ApiProperty({
    description: 'Club que le user cherche à lier à son compte HelloAsso.',
    example: 782,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  originClubId: number;
}
