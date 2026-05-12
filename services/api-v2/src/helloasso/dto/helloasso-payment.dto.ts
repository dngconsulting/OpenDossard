import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { HelloAssoPaymentStatus } from '../entities/helloasso-payment.entity';

/**
 * Réponse de `GET /helloasso/payments/:id` — vue restreinte pour le payeur
 * (champs internes audit comme `payer_firebase_uid` ou tokens HelloAsso non
 * exposés). Utilisée par l'app Dossardeur pour afficher l'état du paiement
 * en cours et confirmer la finalisation.
 */
export class HelloAssoPaymentDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: HelloAssoPaymentStatus })
  status: HelloAssoPaymentStatus;

  @ApiProperty()
  competitionId: number;

  @ApiProperty()
  licenceId: number;

  @ApiProperty({ description: 'Libellé du tarif au moment de l\'engagement (snapshot).' })
  tarifName: string;

  @ApiProperty({ description: 'Montant payé en euros (snapshot).' })
  montant: number;

  @ApiPropertyOptional({ description: 'ISO 8601 — null tant que le paiement n\'est pas confirmé.' })
  paidAt: string | null;

  @ApiProperty({ description: 'ISO 8601 — date de création de la demande de paiement.' })
  createdAt: string;
}
