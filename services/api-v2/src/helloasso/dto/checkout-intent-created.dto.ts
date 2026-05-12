import { ApiProperty } from '@nestjs/swagger';

/**
 * Réponse de `POST /helloasso/payments/checkout-intent`. L'app Dossardeur
 * doit ouvrir `redirectUrl` dans un in-app browser pour conduire le user à la
 * page de paiement HelloAsso. `paymentId` permet de poller le statut via
 * `GET /helloasso/payments/:id` après retour deep link.
 */
export class CheckoutIntentCreatedDto {
  @ApiProperty({ description: 'ID OpenDossard du paiement (clé pour polling).' })
  paymentId: number;

  @ApiProperty({ description: 'URL HelloAsso à ouvrir côté client pour effectuer le paiement.' })
  redirectUrl: string;
}
