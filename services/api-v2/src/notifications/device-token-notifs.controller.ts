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
 * Enregistrement / désenregistrement des tokens FCM pour les push.
 *
 *   POST   /api-v2/devices          { token, platform }   [JWT] → upsert pour le user courant
 *   DELETE /api-v2/devices/:token                          [JWT] → suppression (logout)
 *
 * L'identité du user vient TOUJOURS de `@CurrentUser('id')` (JWT validé),
 * jamais du body — un user n'enregistre un token que pour lui-même.
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
    return this.devices.register(userId, dto.token, dto.platform);
  }

  @Delete(':token')
  @HttpCode(204)
  @ApiOperation({ summary: 'Désenregistre un token FCM (logout)' })
  @ApiResponse({ status: 204, description: 'Token supprimé (idempotent)' })
  unregisterDevice(@Param('token') token: string): Promise<void> {
    return this.devices.unregister(token);
  }
}
