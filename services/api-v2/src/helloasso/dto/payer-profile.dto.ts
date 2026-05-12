import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Profil payeur transmis par l'app Dossardeur (depuis le profil Firebase du
 * user) au moment de la création d'un checkout. Forwarder tel quel à HelloAsso
 * pour pré-remplir la mire — **non persisté côté OpenDossard** (seuls les
 * snapshots firstName/lastName sont stockés sur `helloasso_payment`).
 */
export class PayerProfileDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
