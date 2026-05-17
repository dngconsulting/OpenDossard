import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Payload optionnel pour `POST /helloasso/oauth/authorize`.
 *
 * `originClubId` permet au backend de mémoriser la fiche club depuis laquelle
 * la mire a été initiée — utilisé par le callback pour rediriger sur
 * `/club/{originClubId}` plutôt que `/clubs` en cas d'erreur. Sans cette info,
 * comportement legacy : redirection vers la liste des clubs.
 */
export class AuthorizeRequestDto {
  @ApiPropertyOptional({ description: 'Club depuis lequel la mire est initiée.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  originClubId?: number;
}
