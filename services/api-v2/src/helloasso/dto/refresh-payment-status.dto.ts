import { ApiProperty } from '@nestjs/swagger';

import { HelloAssoPaymentStatus } from '../entities/helloasso-payment.entity';

/**
 * Outcome de l'action admin "refresh status" (cf. `HelloAssoPaymentService.refreshStatusFromHelloAsso`) :
 *  - `transitioned`  : le statut local a changé suite à l'appel HelloAsso
 *  - `still_pending` : HelloAsso n'a pas (encore) d'état terminal — local reste `pending`
 *  - `no_change`     : le payment n'était plus `pending` au moment du refresh (race
 *                      avec un webhook concurrent qui a transitionné entre-temps)
 */
export type RefreshPaymentStatusOutcome = 'transitioned' | 'still_pending' | 'no_change';

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

  @ApiProperty({ enum: ['transitioned', 'still_pending', 'no_change'] })
  outcome: RefreshPaymentStatusOutcome;
}
