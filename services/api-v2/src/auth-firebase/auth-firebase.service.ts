import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
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

  /**
   * Suppression du compte (RGPD — droit à l'effacement). Idempotent.
   *
   * Ordre : Firebase Auth d'abord (le user perd l'accès immédiatement),
   * puis row backend. Si Firebase delete échoue (autre que `user-not-found`),
   * on bail avant de toucher la DB pour ne pas créer un row orphelin sans
   * delete Firebase. Si la suppression Firebase a déjà eu lieu (admin console,
   * autre device), on continue tranquillement vers la DB.
   *
   * Garde-fou : on refuse la suppression d'un user backoffice (firebase_uid
   * NULL) via cet endpoint — il a un autre flow d'admin.
   */
  /**
   * Profile : retourne les infos backend du user firebase courant, après
   * vérif que le user existe encore côté Firebase (ne pas conserver une
   * session "fantôme" si l'admin a supprimé le user via la console).
   *
   * - 404 `auth/user-not-found` côté Firebase → 404 NotFound (le client
   *   mobile fallback automatiquement sur le compte technique anonyme).
   * - Autre erreur Firebase Admin (réseau, quota) : log + on sert le profil
   *   quand même (fail-open). Mieux vaut une donnée légèrement périmée que
   *   d'éjecter un user sain pour un hiccup transitoire de l'API Firebase.
   * - User legacy (firebaseUid NULL) qui appellerait cet endpoint → 403 :
   *   garde-fou, ces users doivent passer par le `/auth/me` legacy.
   *
   * `jwtEmail` vient du payload JWT (sourcé du Firebase ID token au moment
   * de l'exchange/register) — fallback si le client n'arrive pas à lire
   * `getAuth().currentUser.email`.
   */
  async getProfile(userId: number, jwtEmail: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.firebaseUid) {
      throw new ForbiddenException(
        'Endpoint reserved for Firebase-managed accounts',
      );
    }

    try {
      await this.firebaseApp.auth().getUser(user.firebaseUid);
    } catch (e: unknown) {
      const code =
        typeof e === 'object' && e !== null && 'code' in e
          ? (e as { code?: string }).code
          : undefined;
      if (code === 'auth/user-not-found') {
        this.logger.warn(
          `getProfile: firebase user gone uid=${user.firebaseUid} id=${user.id} — client should fallback to anonymous`,
        );
        throw new NotFoundException('Firebase user not found');
      }
      this.logger.warn(
        `getProfile: firebase getUser failed uid=${user.firebaseUid} code=${code} — serving cached profile (fail-open)`,
      );
    }

    return this.toProfileResponse(user, jwtEmail);
  }

  async deleteAccount(userId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      // Idempotent : déjà supprimé, succès silencieux.
      return;
    }
    if (!user.firebaseUid) {
      throw new ForbiddenException(
        'Endpoint reserved for Firebase-managed accounts',
      );
    }

    try {
      await this.firebaseApp.auth().deleteUser(user.firebaseUid);
    } catch (e: unknown) {
      const code =
        typeof e === 'object' && e !== null && 'code' in e
          ? (e as { code?: string }).code
          : undefined;
      if (code !== 'auth/user-not-found') {
        this.logger.warn(
          `deleteAccount: firebase deleteUser failed uid=${user.firebaseUid} code=${code}`,
        );
        throw e;
      }
      this.logger.log(
        `deleteAccount: firebase user already gone uid=${user.firebaseUid}`,
      );
    }

    await this.userRepo.delete({ id: user.id });
    this.logger.log(
      `deleteAccount: deleted user id=${user.id} uid=${user.firebaseUid}`,
    );
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
