import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto';

/**
 * Query params pour `GET /helloasso/payments/admin/all` et
 * `GET /helloasso/payments/admin/competition/:id`.
 *
 * Hérite de `PaginationDto` (offset, limit, search, orderBy, orderDirection).
 * Chaque champ filtrable est `IsOptional + IsString` : la sémantique ILIKE
 * est appliquée côté service (pas de regex côté query, sécurité).
 *
 * **`competitionId` n'apparaît PAS ici** : il est lu par le controller depuis
 * la route param `/competition/:competitionId` pour les endpoints scopés, et
 * absent pour `/all`. Pas un query param utilisateur → évite la confusion.
 */
export class ListPaymentsAdminQueryDto extends PaginationDto {
  // --- Compétition (scope=all uniquement) ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competitionName?: string;

  @ApiPropertyOptional({ description: 'Filtre date événement compétition (ILIKE sur ISO).' })
  @IsOptional()
  @IsString()
  competitionDate?: string;

  // --- Licencié ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  riderNumber?: string;

  @ApiPropertyOptional({ description: 'Filtre sur nom OU prénom du licencié (ILIKE).' })
  @IsOptional()
  @IsString()
  licenceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  club?: string;

  @ApiPropertyOptional({ description: "Multi-valeurs séparées par virgule, ex: 'H,F'." })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Multi-valeurs séparées par virgule.' })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birthYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  catea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  catev?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fede?: string;

  // --- Payeur ---
  @ApiPropertyOptional({ description: 'Filtre sur prénom OU nom du payeur (ILIKE).' })
  @IsOptional()
  @IsString()
  payerName?: string;

  // --- Identifiants HelloAsso ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkoutIntentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentId?: string;

  // --- Statut & tarif & montant ---
  @ApiPropertyOptional({
    description: "Multi-valeurs séparées par virgule, ex: 'paid,pending'.",
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Libellé du tarif (snapshot).' })
  @IsOptional()
  @IsString()
  tarifId?: string;

  @ApiPropertyOptional({ description: 'Montant en euros (ex: "12,50" ou "12.50").' })
  @IsOptional()
  @IsString()
  amount?: string;
}
