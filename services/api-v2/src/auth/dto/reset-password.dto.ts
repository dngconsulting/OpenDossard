import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from './password.rules';

/** Même message que le service pour un token vide ou mal formé : aucun indice supplémentaire. */
const INVALID_LINK_MESSAGE = 'Lien invalide ou expiré';
const PASSWORD_TOO_SHORT_MESSAGE = `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`;

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token reçu dans le lien envoyé par email' })
  @IsString({ message: INVALID_LINK_MESSAGE })
  @IsNotEmpty({ message: INVALID_LINK_MESSAGE })
  token: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString({ message: PASSWORD_TOO_SHORT_MESSAGE })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_TOO_SHORT_MESSAGE })
  newPassword: string;
}
