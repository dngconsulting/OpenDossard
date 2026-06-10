import { ApiProperty } from '@nestjs/swagger';

/**
 * Cibles d'un push organisateur AVANT envoi : alimente la popup de
 * confirmation côté webapp (« Vous allez notifier X utilisateurs »).
 */
export class CompetitionPushTargetsDto {
  @ApiProperty({ description: 'Nombre de users ayant starré l’épreuve.' })
  targetedUsers: number;
}
