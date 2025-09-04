import { ApiProperty } from '@nestjs/swagger';

export class PricingInfo {
  @ApiProperty()
  name: string;
  @ApiProperty()
  tarif: string;
}
