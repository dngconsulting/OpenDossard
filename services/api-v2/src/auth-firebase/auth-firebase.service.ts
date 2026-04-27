import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Type-only import — `admin.app.App` and `admin.auth.DecodedIdToken` are used
// purely as types here. A runtime `import * as admin` would load firebase-admin's
// transitive gRPC stack at module evaluation time, which breaks pg in Jest e2e
// (incident 2026-04-26). The actual `firebase-admin` runtime is required lazily
// inside FirebaseModule's useFactory, only when the factory runs.
import type * as admin from 'firebase-admin';

import { UserEntity } from '../users/entities/user.entity';
import { AuthResponseDto, TokensDto } from '../auth/dto';
import { RegisterDto } from './dto';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';

@Injectable()
export class AuthFirebaseService {
  private readonly logger = new Logger(AuthFirebaseService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(FIREBASE_ADMIN) private readonly firebaseApp: admin.app.App,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Login : lookup strict par firebase_uid, JAMAIS de création.
   * Si introuvable → 403 (le client doit avoir appelé /register au signup).
   *
   * L'email du user firebase n'étant PAS persisté en base, on le source
   * directement depuis le idToken (vérifié) pour la réponse et le JWT.
   */
  async exchange(idToken: string): Promise<AuthResponseDto> {
    const decoded = await this.verifyAndRequireEmail(idToken);

    const user = await this.userRepo.findOne({
      where: { firebaseUid: decoded.uid },
    });
    if (!user) {
      this.logger.warn(
        `exchange rejected: no backend mapping for uid=${decoded.uid}`,
      );
      throw new ForbiddenException('No backend account for this Firebase user');
    }

    const tokens = await this.generateTokens(user, decoded.email!);
    return { ...tokens, user: this.toProfileResponse(user, decoded.email!) };
  }

  /**
   * Signup : crée la ligne backend pour un user Firebase fraîchement inscrit.
   *
   * L'email n'est **PAS persisté** côté backend pour les users firebase :
   * Firebase Auth est la source de vérité.
   *
   * **Pas de check d'unicité d'email avec les users legacy**. Décision
   * 2026-04-27 : une row firebase et une row legacy peuvent coexister pour
   * "la même personne" — ce sont deux identités fonctionnelles distinctes
   * (rôles différents, méthodes d'auth différentes, ressources disjointes).
   * L'autorisation reste portée par les `roles` du JWT, pas par l'identité.
   *
   * Seul conflit possible : firebase_uid déjà mappé (re-register du même user).
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const decoded = await this.verifyAndRequireEmail(dto.idToken);

    const existingByUid = await this.userRepo.findOne({
      where: { firebaseUid: decoded.uid },
    });
    if (existingByUid) {
      throw new ConflictException('User already registered');
    }

    const user = this.userRepo.create({
      firebaseUid: decoded.uid,
      signInProvider: decoded.firebase?.sign_in_provider ?? 'password',
      // email volontairement non écrit : source de vérité = Firebase Auth.
      email: null,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      password: null as unknown as string, // Firebase = source de vérité
      roles: 'MOBILE',
    });
    await this.userRepo.save(user);

    this.logger.log(
      `register: created user id=${user.id} uid=${decoded.uid} provider=${user.signInProvider}`,
    );

    const tokens = await this.generateTokens(user, decoded.email!);
    return { ...tokens, user: this.toProfileResponse(user, decoded.email!) };
  }

  private async verifyAndRequireEmail(
    idToken: string,
  ): Promise<admin.auth.DecodedIdToken> {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await this.firebaseApp.auth().verifyIdToken(idToken, false);
    } catch (e: unknown) {
      const code =
        typeof e === 'object' && e !== null && 'code' in e
          ? (e as { code?: string }).code
          : undefined;
      this.logger.warn(`verifyIdToken failed code=${code}`);
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
    if (!decoded.email) {
      throw new BadRequestException('Email required');
    }
    return decoded;
  }

  /**
   * Construit la réponse profil. L'email est passé en paramètre car il n'est
   * pas garanti d'être persisté côté entity (firebase mode = NULL).
   */
  private toProfileResponse(user: UserEntity, email: string) {
    return {
      id: user.id,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.getRolesArray(),
      phone: user.phone,
    };
  }

  private async generateTokens(
    user: UserEntity,
    email: string,
  ): Promise<TokensDto> {
    // Payload STRICTEMENT identique à AuthService.generateTokens() (auth.service.ts legacy)
    // L'email est sourcé du idToken Firebase (param `email`) plutôt que de
    // `user.email` qui peut être NULL pour les firebase users.
    const payload = {
      sub: user.id,
      email,
      roles: user.getRolesArray(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRE', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRE', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
