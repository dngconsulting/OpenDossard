import { ApiProperty } from '@nestjs/swagger';

import { HelloAssoPaymentStatus } from '../entities/helloasso-payment.entity';

/**
 * Outcome de l'action admin "refresh status" (cf. `HelloAssoPaymentService.refreshStatusFromHelloAsso`) :
 *  - `transitioned`  : le statut local a changé suite à l'appel HelloAsso
 *  - `confirmed`     : HelloAsso a été interrogé, l'état renvoyé matche le
 *                      statut local — aucune transition nécessaire. Inclut le
 *                      cas race-with-webhook (le statut courant est déjà le bon).
 *  - `still_pending` : statut local `pending` et HelloAsso n'a pas (encore)
 *                      d'état terminal (utilisateur n'a pas finalisé sur la mire).
 */
export type RefreshPaymentStatusOutcome = 'transitioned' | 'confirmed' | 'still_pending';

export class RefreshPaymentStatusDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: HelloAssoPaymentStatus })
  status: HelloAssoPaymentStatus;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  paidAt: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: `État brut HelloAsso (PaymentState) du dernier payment côté order.
\`null\` si aucun payment n'existe encore côté HelloAsso (utilisateur a ouvert
la mire mais n'a rien finalisé).`,
  })
  helloAssoState: string | null;

  @ApiProperty({ enum: ['transitioned', 'confirmed', 'still_pending'] })
  outcome: RefreshPaymentStatusOutcome;
}
