import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MinLength, Min, ValidateNested } from 'class-validator';

import { PayerProfileDto } from './payer-profile.dto';

export class CreateCheckoutIntentDto {
  @ApiProperty({ description: 'ID de la compétition (épreuve) ciblée.' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  competitionId: number;

  @ApiProperty({ description: 'Libellé du tarif choisi (clé `PricingInfo.name`).' })
  @IsString()
  @MinLength(1)
  tarifName: string;

  @ApiProperty({
    description:
      "ID unique de la licence du coureur à engager. Clé d'identité — le " +
      "`licenceNumber` n'est PAS unique (les non-licenciés partagent `'NC'`).",
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  licenceId: number;

  @ApiPropertyOptional({
    description:
      'Numéro de licence — snapshot optionnel (affichage / compat ancienne app). ' +
      "N'est PLUS utilisé pour résoudre la licence (cf. `licenceId`).",
  })
  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @ApiProperty({
    type: () => PayerProfileDto,
    description: 'Profil du payeur depuis Firebase (forward HelloAsso, non persisté).',
  })
  @ValidateNested()
  @Type(() => PayerProfileDto)
  payerProfile: PayerProfileDto;
}
