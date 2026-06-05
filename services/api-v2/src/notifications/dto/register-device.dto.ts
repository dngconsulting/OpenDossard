import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Payload de `POST /devices` : enregistrement du token FCM de l'appareil
 * courant pour le user authentifié (lu via `@CurrentUser('id')`, jamais du body).
 */
export class RegisterDeviceDto {
  @ApiProperty({ description: 'Token FCM (registration token) de l’appareil.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

  @ApiProperty({ description: 'Plateforme de l’appareil.', enum: ['ios', 'android'] })
  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
