import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { HelloAssoPaymentStatus } from '../entities/helloasso-payment.entity';

/**
 * DTO ligne pour les endpoints admin/orga `GET /helloasso/payments/admin/*`.
 *
 * Superset enrichi de `HelloAssoPaymentDto` (vue payeur restreinte) : ajoute
 * les identifiants HelloAsso (intent / order / payment), le snapshot payeur,
 * les colonnes licence (JOIN) et race (JOIN par `(competitionId, licenceId)`).
 *
 * Sécurité : TOUS les endpoints qui renvoient ce DTO sont ADMIN/ORGANISATEUR
 * only — MOBILE doit JAMAIS le recevoir (il révèle l'identité du payeur et les
 * IDs de transaction HelloAsso d'autrui). L'app mobile utilise la vue SLIM
 * `CompetitionPaymentDto` (`GET competition/:competitionId`), sans aucune
 * donnée sensible.
 */
export class PaymentAdminRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: HelloAssoPaymentStatus })
  status: HelloAssoPaymentStatus;

  // --- Compétition (JOIN competition) ---
  @ApiProperty()
  competitionId: number;

  @ApiPropertyOptional({ description: 'Nom de la compétition (NULL si compétition supprimée).' })
  competitionName: string | null;

  @ApiPropertyOptional({ description: "Date d'événement compétition (ISO 8601)." })
  competitionDate: string | null;

  // --- Licencié (JOIN licence) ---
  @ApiProperty()
  licenceId: number;

  @ApiPropertyOptional({ description: 'Nom de famille du coureur (`licence.name`).' })
  licenceName: string | null;

  @ApiPropertyOptional()
  licenceFirstName: string | null;

  @ApiPropertyOptional()
  club: string | null;

  @ApiPropertyOptional()
  gender: string | null;

  @ApiPropertyOptional()
  dept: string | null;

  @ApiPropertyOptional()
  birthYear: string | null;

  @ApiPropertyOptional()
  catea: string | null;

  @ApiPropertyOptional()
  catev: string | null;

  @ApiPropertyOptional()
  fede: string | null;

  // --- Race (JOIN race par `(competitionId, licenceId)`) — peut être NULL si
  // le paiement existe mais aucune race n'est encore créée (ex: pending avant
  // attribution dossard, ou paiement sans race correspondante).
  @ApiPropertyOptional({
    description: 'Dossard du coureur sur cette course (`race.rider_dossard`).',
  })
  riderNumber: number | null;

  @ApiPropertyOptional({ description: 'Code de la course (`race.race_code`).' })
  raceCode: string | null;

  // --- Payeur (JOIN user sur payer_user_id) ---
  @ApiPropertyOptional({ description: 'NULL si compte supprimé (RGPD).' })
  payerUserId: number | null;

  @ApiPropertyOptional({ description: 'Prénom du payeur (`user.first_name` ou snapshot).' })
  payerFirstName: string | null;

  @ApiPropertyOptional({ description: 'Nom du payeur (`user.last_name` ou snapshot).' })
  payerLastName: string | null;

  // --- Identifiants HelloAsso ---
  @ApiPropertyOptional({ description: 'ID checkout-intent HelloAsso (numéro de demande).' })
  checkoutIntentId: string | null;

  @ApiPropertyOptional({ description: 'ID order HelloAsso (numéro de commande).' })
  orderId: string | null;

  @ApiPropertyOptional({ description: 'ID payment HelloAsso (numéro de transaction).' })
  paymentId: string | null;

  // --- Tarif & montant ---
  @ApiProperty({ description: "Libellé du tarif au moment de l'engagement (snapshot)." })
  tarifId: string;

  @ApiProperty({ description: 'Montant payé en euros (`amount_cents / 100`).' })
  amount: number;

  // --- Dates ---
  @ApiProperty({ description: 'ISO 8601 — date de création de la demande de paiement.' })
  createdAt: string;

  @ApiPropertyOptional({ description: 'ISO 8601 — date du paiement confirmé (NULL si pas payé).' })
  paidAt: string | null;
}
