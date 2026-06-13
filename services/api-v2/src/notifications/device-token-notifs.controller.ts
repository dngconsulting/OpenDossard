import { Body, Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums';
import { DeviceTokenNotifsService } from './device-token-notifs.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

/**
 * Enregistrement / désenregistrement des appareils pour les push FCM.
 *
 *   POST   /api-v2/devices                 { token, platform, deviceId }  [JWT] → upsert
 *   DELETE /api-v2/devices/by-device/:deviceId                            [JWT] → opt-out / logout
 *
 * Clé d'identité = `deviceId` (UUID d'installation stable), pas le token FCM
 * qui peut tourner. L'identité du user vient TOUJOURS de `@CurrentUser('id')`
 * (JWT validé), jamais du body — un user n'enregistre ET ne supprime un
 * appareil que pour lui-même (scopé au user courant, finding audit M6).
 */
@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
export class DeviceTokenNotifsController {
  constructor(private readonly devices: DeviceTokenNotifsService) {}

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Enregistre (upsert) le token FCM de l’appareil courant' })
  @ApiResponse({ status: 204, description: 'Token enregistré' })
  registerDevice(@Body() dto: RegisterDeviceDto, @CurrentUser('id') userId: number): Promise<void> {
    return this.devices.register(userId, dto.token, dto.platform, dto.deviceId);
  }

  @Delete('by-device/:deviceId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Désenregistre un appareil par son identité (opt-out fiable)',
    description: 'Supprime la ligne du device pour le user courant. Indépendant du token FCM.',
  })
  @ApiResponse({ status: 204, description: 'Appareil désenregistré (idempotent, scopé au user)' })
  unregisterByDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser('id') userId: number,
  ): Promise<void> {
    return this.devices.unregisterByDevice(userId, deviceId);
  }
}
