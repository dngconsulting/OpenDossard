import { ApiProperty } from '@nestjs/swagger';

import { Federation } from '../../common/enums';

/**
 * Épreuve favorite affichée dans « Mon compte » sur Dossardeur.
 * Liste non paginée : les épreuves passées sont purgées régulièrement.
 */
export class FavoriteCompetitionDto {
  @ApiProperty({ description: 'Identifiant de la compétition.' })
  competitionId: number;

  @ApiProperty({ description: 'Nom de la compétition.' })
  name: string;

  @ApiProperty({ description: 'Date de la compétition.' })
  eventDate: Date;

  @ApiProperty({ enum: Federation, description: 'Fédération de la compétition.' })
  fede: Federation;
}
