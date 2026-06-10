import { ApiProperty } from '@nestjs/swagger';

/**
 * Résultat d'un push organisateur : ce que l'UI affiche après envoi
 * (« envoyé à N personnes »). Fire-and-forget : rien n'est persisté.
 */
export class CompetitionPushResultDto {
  @ApiProperty({ description: 'Nombre de users ayant starré l’épreuve (ciblés).' })
  targetedUsers: number;

  @ApiProperty({ description: 'Nombre d’appareils effectivement notifiés par FCM.' })
  sentDevices: number;
}
