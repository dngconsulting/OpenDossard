import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { HelloAssoPaymentStatus } from '../entities/helloasso-payment.entity';

/**
 * Query params de `GET /helloasso/payments` (filtres optionnels).
 *
 * **Aucun champ user-id ici** : le scope est TOUJOURS `currentUser` (JWT,
 * cf. controller). Tenter d'ajouter un `userId` ici ouvrirait un trou
 * Broken Access Control. Si un endpoint admin "all payments" devient
 * nécessaire un jour, faire un endpoint dédié `/admin/payments` avec son
 * propre guard, pas un override sur celui-ci.
 */
export class ListPaymentsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtre sur une compétition. Sans param = tous les paiements du user.',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  competitionId?: number;

  @ApiPropertyOptional({
    description: 'Filtre sur un statut. Sans param = tous statuts.',
    enum: HelloAssoPaymentStatus,
  })
  @IsOptional()
  @IsEnum(HelloAssoPaymentStatus)
  status?: HelloAssoPaymentStatus;
}
