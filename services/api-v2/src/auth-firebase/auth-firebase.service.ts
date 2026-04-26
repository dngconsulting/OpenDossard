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

    const tokens = await this.generateTokens(user);
    return { ...tokens, user: this.toProfileResponse(user) };
  }

  /**
   * Signup : crée la ligne backend pour un user Firebase fraîchement inscrit.
   * Email pris du token (authentique), pas du body.
   * Conflits possibles : firebase_uid déjà mappé OU email déjà utilisé.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const decoded = await this.verifyAndRequireEmail(dto.idToken);

    const existingByUid = await this.userRepo.findOne({
      where: { firebaseUid: decoded.uid },
    });
    if (existingByUid) {
      throw new ConflictException('User already registered');
    }

    const existingByEmail = await this.userRepo.findOne({
      where: { email: decoded.email! },
    });
    if (existingByEmail) {
      // Cas typique : un user backoffice (ADMIN/ORGANIZER) a déjà cet email,
      // ou l'email a été migré en tant que MOBILE legacy. Refus dur en v1.
      throw new ConflictException('Email already used by another account');
    }

    const user = this.userRepo.create({
      firebaseUid: decoded.uid,
      signInProvider: decoded.firebase?.sign_in_provider ?? 'password',
      email: decoded.email!,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      password: null as unknown as string, // Firebase = source de vérité
      roles: 'MOBILE',
    });
    await this.userRepo.save(user);

    this.logger.log(
      `register: created user id=${user.id} uid=${decoded.uid} provider=${user.signInProvider}`,
    );

    const tokens = await this.generateTokens(user);
    return { ...tokens, user: this.toProfileResponse(user) };
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

  private toProfileResponse(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.getRolesArray(),
      phone: user.phone,
    };
  }

  private async generateTokens(user: UserEntity): Promise<TokensDto> {
    // Payload STRICTEMENT identique à AuthService.generateTokens() (auth.service.ts legacy)
    const payload = {
      sub: user.id,
      email: user.email,
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
