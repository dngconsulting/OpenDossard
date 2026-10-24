import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailConfig } from './mail.config';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Lien affiché en mode `log` (dev local uniquement). */
  debugLink?: string;
}

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_TIMEOUT_MS = 10_000;
/** Longueur max du message d'erreur Brevo recopié dans nos exceptions. */
const BREVO_ERROR_MAX_LENGTH = 200;

/**
 * Envoi d'emails transactionnels via l'API HTTP de Brevo (pas de SMTP).
 * Le comportement dépend de `MailConfig.mode` (cf. mail.config.ts). En mode
 * `disabled` (config invalide), `send` n'envoie rien, logue une erreur et
 * résout : l'appelant n'a rien à gérer, l'erreur de config est déjà au boot.
 *
 * Ni la clé API ni le corps de la requête ne sont jamais logués : le corps
 * contient typiquement un lien à usage unique (réinitialisation de mot de passe).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isProduction: boolean;

  constructor(
    private readonly config: MailConfig,
    configService: ConfigService,
  ) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    // Visible dès le boot : un environnement déployé sans MAIL_MODE n'envoie rien.
    if (this.isProduction && config.mode === 'log') {
      this.logger.warn('MAIL_MODE=log en production : aucun email ne sera envoyé');
    }
  }

  async send(message: MailMessage): Promise<void> {
    if (this.config.mode === 'disabled') {
      // Jamais le lien ni le corps : seulement destinataire, sujet et raison.
      this.logger.error(
        `Email NON envoyé à ${message.to} — « ${message.subject} » : ` +
          `configuration mail invalide (${this.config.problems.join(' ; ')})`,
      );
      return;
    }
    if (this.config.mode === 'log') {
      this.logOnly(message);
      return;
    }

    const redirected = this.config.mode === 'redirect';
    const to = redirected ? this.config.redirectTo : message.to;
    const subject = redirected ? `[Redirigé → ${message.to}] ${message.subject}` : message.subject;

    const response = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        'api-key': this.config.brevoApiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: this.config.fromName
          ? { email: this.config.from, name: this.config.fromName }
          : { email: this.config.from },
        to: [{ email: to }],
        subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      const detail = typeof payload?.message === 'string' ? ` : ${truncate(payload.message)}` : '';
      throw new Error(`Échec de l'envoi Brevo (HTTP ${response.status})${detail}`);
    }

    const messageId =
      typeof payload?.messageId === 'string' ? ` (messageId ${payload.messageId})` : '';
    this.logger.log(`Email envoyé à ${to} — « ${subject} »${messageId}`);
  }

  private logOnly(message: MailMessage): void {
    if (this.isProduction) {
      // Le lien n'est jamais logué en production : il donnerait accès au compte.
      this.logger.warn(
        `MAIL_MODE=log en production : email NON envoyé à ${message.to} — « ${message.subject} »`,
      );
      return;
    }
    const link = message.debugLink ? ` — lien : ${message.debugLink}` : '';
    this.logger.log(
      `[MAIL_MODE=log] Email non envoyé à ${message.to} — « ${message.subject} »${link}`,
    );
  }
}

/** Corps JSON de la réponse, ou `null` si absent ou illisible (ex. page HTML d'un proxy). */
async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await response.json();
    return body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function truncate(text: string): string {
  return text.length > BREVO_ERROR_MAX_LENGTH ? `${text.slice(0, BREVO_ERROR_MAX_LENGTH)}…` : text;
}
