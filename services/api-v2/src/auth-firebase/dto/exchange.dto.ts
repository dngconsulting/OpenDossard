import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeDto {
  @ApiProperty({
    description: 'Firebase ID token obtenu via Firebase Auth SDK côté mobile',
    example: 'eyJhbGciOi...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
