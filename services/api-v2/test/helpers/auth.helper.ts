import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Role } from '../../src/common/enums';

export class AuthHelper {
  private jwtService: JwtService;
  private jwtSecret: string;

  constructor(app: INestApplication) {
    this.jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
    this.jwtSecret = configService.get('JWT_SECRET', 'opendossard-secret-v2');
  }

  /**
   * Génère un token JWT valide pour un utilisateur avec les rôles spécifiés.
   * Pas de roundtrip HTTP — signe directement via JwtService.
   */
  generateToken(userId: number, email: string, roles: Role[]): string {
    return this.jwtService.sign(
      { sub: userId, email, roles },
      { secret: this.jwtSecret, expiresIn: '1h' },
    );
  }

  /** Token ADMIN (user ID 1, seedé par SeedHelper) */
  getAdminToken(): string {
    return this.generateToken(1, 'admin@test.com', [Role.ADMIN]);
  }

  /** Token ORGANISATEUR (user ID 2, seedé par SeedHelper) */
  getOrgaToken(): string {
    return this.generateToken(2, 'orga@test.com', [Role.ORGANISATEUR]);
  }

  /** Token MOBILE (user ID 3, seedé par SeedHelper) */
  getMobileToken(): string {
    return this.generateToken(3, 'mobile@test.com', [Role.MOBILE]);
  }

  /** Header Authorization prêt à l'emploi */
  adminAuth(): [string, string] {
    return ['Authorization', `Bearer ${this.getAdminToken()}`];
  }

  orgaAuth(): [string, string] {
    return ['Authorization', `Bearer ${this.getOrgaToken()}`];
  }
}
