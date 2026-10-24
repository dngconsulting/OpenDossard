import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, IsNull, MoreThan, QueryFailedError, Repository } from 'typeorm';

import { MailService } from '../common/mail';
import { UserEntity } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import {
  ACTIVE_TOKEN_PER_USER_INDEX,
  PasswordResetTokenEntity,
} from './entities/password-reset-token.entity';
import { buildPasswordResetMail } from './password-reset.mail';
import { parseWebappPublicUrl } from './webapp-public-url';

const TOKEN_TTL_MS = 60 * 60 * 1000;
/** Délai minimal entre deux emails pour un même compte (anti mail-bombing multi-IP). */
const RESEND_COOLDOWN_MS = 60 * 1000;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/** Violation de l'index « un seul token actif par user » (code Postgres 23505). */
const isActiveTokenConflict = (err: unknown): boolean => {
  if (!(err instanceof QueryFailedError)) return false;
  const driverError = err.driverError as { code?: string; constraint?: string };
  return driverError.code === '23505' && driverError.constraint === ACTIVE_TOKEN_PER_USER_INDEX;
};

/**
 * Réinitialisation de mot de passe par lien email à usage unique.
 *
 * Toutes les dates viennent de Node, jamais de `now()` SQL : les colonnes sont
 * en `timestamp` sans fuseau, une comparaison mixte Node/Postgres serait faussée
 * par le décalage de fuseau entre les deux.
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  /** `null` si WEBAPP_PUBLIC_URL est invalide : demande de lien désactivée. */
  private readonly webappPublicUrl: string | null;

  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly tokenRepository: Repository<PasswordResetTokenEntity>,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    configService: ConfigService,
  ) {
    // Jamais déduit de la requête HTTP (en-tête Host falsifiable → lien piégé).
    // Une URL invalide n'empêche pas l'API de démarrer : seule la demande de
    // lien est désactivée, avec une erreur dans les logs. Un lien déjà envoyé
    // reste utilisable (resetPassword n'a pas besoin de l'URL).
    const parsed = parseWebappPublicUrl(
      configService.get<string>('WEBAPP_PUBLIC_URL'),
      configService.get<string>('NODE_ENV') === 'production',
    );
    if ('error' in parsed) {
      this.webappPublicUrl = null;
      this.logger.error(`${parsed.error} : la réinitialisation de mot de passe est désactivée`);
    } else {
      this.webappPublicUrl = parsed.origin;
    }
  }

  /**
   * Appelé sans être attendu par le contrôleur : la réponse HTTP (contenu comme
   * temps de réponse) ne doit pas révéler si un compte existe pour cet email.
   * Une erreur (base, envoi du mail) rejette la promesse ; le contrôleur la logue.
   */
  async requestReset(email: string): Promise<void> {
    const webappPublicUrl = this.webappPublicUrl;
    if (webappPublicUrl === null) {
      // Ni email ni lien dans le log ; la réponse HTTP reste identique.
      this.logger.error(
        'Demande de réinitialisation ignorée : WEBAPP_PUBLIC_URL invalide (cf. log de démarrage)',
      );
      return;
    }

    // Même lookup que le login : le compte réinitialisé est celui qui se connecte.
    const user = await this.authService.findByLoginEmailWithPassword(email);
    if (!user?.password || !user.email) {
      return;
    }

    const now = new Date();
    const recentlySent = await this.tokenRepository.exists({
      where: {
        userId: user.id,
        usedAt: IsNull(),
        createdAt: MoreThan(new Date(now.getTime() - RESEND_COOLDOWN_MS)),
      },
    });
    if (recentlySent) {
      return;
    }

    const token = randomBytes(32).toString('base64url');
    try {
      await this.dataSource.transaction(async manager => {
        // Un seul lien valide à la fois : les précédents sont invalidés.
        await manager.update(
          PasswordResetTokenEntity,
          { userId: user.id, usedAt: IsNull() },
          { usedAt: now },
        );
        await manager.insert(PasswordResetTokenEntity, {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
          createdAt: now,
        });
      });
    } catch (err) {
      // Index unique partiel : une demande concurrente pour ce compte vient
      // d'insérer son token (et enverra son mail). Rien à faire.
      if (isActiveTokenConflict(err)) {
        this.logger.debug(`Demande concurrente ignorée pour le user #${user.id}`);
        return;
      }
      throw err;
    }

    // Token en fragment (#) : jamais envoyé au serveur, donc absent des logs
    // nginx et de l'en-tête Referer.
    const link = `${webappPublicUrl}/reset-password#token=${token}`;
    await this.mailService.send({
      to: user.email,
      ...buildPasswordResetMail(user.firstName, link),
      debugLink: link,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const now = new Date();
    const resetToken = await this.tokenRepository.findOne({
      where: { tokenHash: hashToken(token), usedAt: IsNull(), expiresAt: MoreThan(now) },
    });
    if (!resetToken) {
      throw new BadRequestException('Lien invalide ou expiré');
    }

    // Hash calculé hors transaction : bcrypt (coût 12) est lent.
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.dataSource.transaction(async manager => {
      // Consommation conditionnelle : en cas de double soumission concurrente,
      // une seule requête passe.
      const consumed = await manager.update(
        PasswordResetTokenEntity,
        { id: resetToken.id, usedAt: IsNull() },
        { usedAt: now },
      );
      if (consumed.affected === 0) {
        throw new BadRequestException('Lien invalide ou expiré');
      }
      await manager.update(UserEntity, resetToken.userId, { password: passwordHash });
    });
  }
}
