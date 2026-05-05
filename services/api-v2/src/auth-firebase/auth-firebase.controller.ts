import { Body, Controller, Delete, Post, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthFirebaseService } from './auth-firebase.service';
import { ExchangeDto, RegisterDto } from './dto';
import { AuthResponseDto } from '../auth/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('auth-firebase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/firebase')
export class AuthFirebaseController {
  constructor(private readonly service: AuthFirebaseService) {}

  @Post('exchange')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange Firebase ID token for backend JWT (login)',
    description: `Vérifie un ID token Firebase via firebase-admin et retrouve le user backend
par firebase_uid (lookup strict, sans création). Émet une paire
{ accessToken, refreshToken } strictement au format legacy de POST /auth/login.
Si le firebase_uid n'a pas de mapping en base → 403 (utiliser /register d'abord).`,
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'idToken manquant ou email absent du token' })
  @ApiResponse({ status: 401, description: 'idToken invalide, expiré ou révoqué' })
  @ApiResponse({ status: 403, description: 'Aucun compte backend pour ce Firebase user' })
  async exchange(@Body() dto: ExchangeDto): Promise<AuthResponseDto> {
    return this.service.exchange(dto.idToken);
  }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Register a new mobile user (signup)',
    description: `Crée explicitement la ligne user backend pour un user Firebase fraîchement
inscrit côté mobile. L'email est extrait du token Firebase (jamais du body).
Échec si firebase_uid déjà mappé (409) ou email déjà utilisé par un autre
compte (409 — typiquement collision avec un user backoffice).
Émet directement une paire de tokens — l'utilisateur est connecté à l'issue.`,
  })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'idToken/firstName/lastName manquant ou email absent du token' })
  @ApiResponse({ status: 401, description: 'idToken invalide, expiré ou révoqué' })
  @ApiResponse({ status: 409, description: 'firebase_uid déjà enregistré ou email déjà pris' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.service.register(dto);
  }

  @Delete('me')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete the current Firebase-managed account (RGPD)',
    description: `Supprime le compte courant côté Firebase Auth (via firebase-admin)
puis la ligne backend correspondante. Idempotent : supprimer un compte déjà
supprimé renvoie 204 silencieusement. Refuse 403 si le user résolu n'est
pas un user mobile firebase (garde-fou anti-suppression d'admin backoffice
via cet endpoint).`,
  })
  @ApiResponse({ status: 204, description: 'Compte supprimé' })
  @ApiResponse({ status: 403, description: 'Compte non éligible (non firebase)' })
  async deleteMe(@CurrentUser('id') userId: number): Promise<void> {
    await this.service.deleteAccount(userId);
  }
}
