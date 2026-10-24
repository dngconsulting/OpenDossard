import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'organisateur@example.com' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;
}
