import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description:
      'Firebase ID token obtenu après createUserWithEmailAndPassword côté mobile',
    example: 'eyJhbGciOi...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({ example: 'Sami' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Jaber' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;
}
