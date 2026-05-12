import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, MinLength, Min, ValidateNested } from 'class-validator';

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

  @ApiProperty({ description: 'Numéro de licence (clé business) du coureur à engager.' })
  @IsString()
  @MinLength(1)
  licenceNumber: string;

  @ApiProperty({ type: () => PayerProfileDto, description: 'Profil du payeur depuis Firebase (forward HelloAsso, non persisté).' })
  @ValidateNested()
  @Type(() => PayerProfileDto)
  payerProfile: PayerProfileDto;
}
