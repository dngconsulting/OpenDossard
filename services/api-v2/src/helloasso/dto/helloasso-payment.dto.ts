import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { HelloAssoPaymentStatus } from '../entities/helloasso-payment.entity';

/**
 * Réponse des endpoints lecture de paiement (vue restreinte pour le payeur —
 * pas de `payer_firebase_uid` ni tokens HelloAsso). Utilisée par l'app
 * Dossardeur :
 *  - `GET /helloasso/payments/:id` : polling après deep link (champs
 *    `competition*` omis — le mobile a déjà les infos compétition en cache)
 *  - `GET /helloasso/payments` : liste pour l'écran "Mes paiements" (champs
 *    `competition*` populés via LEFT JOIN service-side)
 */
export class HelloAssoPaymentDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: HelloAssoPaymentStatus })
  status: HelloAssoPaymentStatus;

  @ApiProperty()
  competitionId: number;

  @ApiPropertyOptional({
    description: 'Nom de la compétition (populé par `GET /payments` liste uniquement).',
  })
  competitionName?: string;

  @ApiPropertyOptional({ description: "Date d'événement compétition ISO 8601 (liste uniquement)." })
  competitionDate?: string;

  @ApiPropertyOptional({ description: 'Fédération de la compétition (liste uniquement).' })
  competitionFede?: string;

  @ApiProperty()
  licenceId: number;

  @ApiProperty({ description: "Libellé du tarif au moment de l'engagement (snapshot)." })
  tarifName: string;

  @ApiProperty({ description: 'Montant payé en euros (snapshot).' })
  montant: number;

  @ApiPropertyOptional({ description: "ISO 8601 — null tant que le paiement n'est pas confirmé." })
  paidAt: string | null;

  @ApiProperty({ description: 'ISO 8601 — date de création de la demande de paiement.' })
  createdAt: string;
}
