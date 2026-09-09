import type { PaymentStatusSeverity } from '../helloasso-status-detail.util';
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

  @ApiPropertyOptional({ description: 'Prénom du coureur engagé (liste uniquement).' })
  licenceFirstName?: string;

  @ApiPropertyOptional({ description: 'Nom de famille du coureur engagé (liste uniquement).' })
  licenceLastName?: string;

  @ApiProperty({ description: "Libellé du tarif au moment de l'engagement (snapshot)." })
  tarifName: string;

  @ApiProperty({ description: 'Montant payé en euros (snapshot).' })
  montant: number;

  @ApiPropertyOptional({ description: "ISO 8601 — null tant que le paiement n'est pas confirmé." })
  paidAt: string | null;

  @ApiProperty({ description: 'ISO 8601 — date de création de la demande de paiement.' })
  createdAt: string;

  /**
   * Phrase discriminante à afficher sous le statut. `null` quand le statut se
   * suffit à lui-même (`paid`).
   *
   * Existe parce que `refused` agrège six causes très différentes — refus
   * bancaire, erreur technique, abandon, annulation HelloAsso, annulation par le
   * coureur, remplacement par une nouvelle tentative — que rien ne distinguait
   * jusqu'ici à l'écran.
   */
  @ApiPropertyOptional({
    description: 'Cause détaillée du statut, prête à afficher. `null` si sans objet.',
    example: 'Refusé par la banque',
  })
  statusDetail?: string | null;

  /**
   * Gravité SÉMANTIQUE, pas une couleur : chaque client fait sa correspondance
   * vers sa palette. Centralisée ici pour que back-office et mobile ne divergent
   * pas au premier ajout de cause.
   */
  @ApiPropertyOptional({
    description: 'Gravité sémantique du statut.',
    enum: ['success', 'info', 'error', 'neutral', 'muted'],
  })
  statusSeverity?: PaymentStatusSeverity;

  /**
   * QUI a écrit le statut courant (`user_cancel`, `superseded`, `helloasso_webhook`…).
   * C'est le discriminant des causes qu'aucun événement HelloAsso n'accompagne.
   */
  @ApiPropertyOptional({ description: 'Origine du statut courant.', example: 'user_cancel' })
  statusSource?: string | null;

  /** Dernier `PaymentState` BRUT vu chez HelloAsso, états non mappés compris. */
  @ApiPropertyOptional({ description: 'Dernier état HelloAsso brut.', example: 'Refused' })
  helloAssoLastState?: string | null;

  /** ISO 8601 — quand HelloAsso a parlé pour la dernière fois. */
  @ApiPropertyOptional({ description: 'ISO 8601 — dernier signe de vie HelloAsso.' })
  helloAssoLastStateAt?: string | null;
}
