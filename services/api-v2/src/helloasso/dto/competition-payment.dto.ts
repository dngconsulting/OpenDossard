import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { HelloAssoPaymentStatus } from '../entities/helloasso-payment.entity';

/**
 * DTO paiement SLIM d'une compétition pour l'app mobile (onglet "Inscrits").
 *
 * Vue volontairement restreinte aux colonnes affichées (start-list) : identité
 * du coureur (licence), catégorie, club, fédération, tarif/montant et statut.
 * AUCUNE donnée sensible — pas d'identité du payeur (`payer_*`), pas
 * d'identifiants de transaction HelloAsso. C'est ce qui permet d'exposer cet
 * endpoint à MOBILE sans la fuite du `PaymentAdminRowDto` complet (réservé
 * ADMIN/ORGANISATEUR).
 *
 * Le backend ne renvoie que les statuts `paid` et `pending` (engagements
 * actifs) ; refused/refunding/refunded sont exclus côté serveur.
 *
 * `catev` = catégorie de VALEUR de la licence (pas une catégorie de course
 * assignée — l'épreuve n'a pas encore réparti les coureurs dans les courses).
 *
 * `createdAt` / `paidAt` sont des ajouts additifs (rétro-compatibles) : les
 * anciens clients mobiles les ignorent ; les nouveaux écartent les `pending`
 * abandonnés (> 15 min depuis `createdAt`) côté client et peuvent s'appuyer sur
 * `paidAt` pour le tri.
 */
export class CompetitionPaymentDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: HelloAssoPaymentStatus })
  status: HelloAssoPaymentStatus;

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
  catea: string | null;

  @ApiPropertyOptional({ description: 'Catégorie de valeur de la licence.' })
  catev: string | null;

  @ApiPropertyOptional()
  fede: string | null;

  @ApiProperty({ description: "Libellé du tarif au moment de l'engagement (snapshot)." })
  tarifId: string;

  @ApiProperty({ description: 'Montant payé en euros (`amount_cents / 100`).' })
  amount: number;

  @ApiProperty({
    description:
      "ISO 8601 — date de création de l'intention de paiement. Permet au mobile de " +
      'masquer les `pending` trop anciens (intents abandonnés) sans filtre serveur.',
  })
  createdAt: string;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'ISO 8601 — date du passage en `paid` (null tant que le paiement est `pending`). ' +
      'Sert au tri « plus récents en tête » au sein de chaque catégorie.',
  })
  paidAt: string | null;
}
