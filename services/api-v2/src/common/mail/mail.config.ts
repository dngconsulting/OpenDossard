import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MailMode = 'send' | 'redirect' | 'log';

const MAIL_MODES: readonly MailMode[] = ['send', 'redirect', 'log'];

/**
 * Config d'envoi des emails transactionnels (fournisseur Brevo).
 *
 * Trois modes, pilotés par `MAIL_MODE` :
 *   - `send`     : envoi réel (PROD, PREPROD) ;
 *   - `redirect` : envoi réel, mais tout part vers `MAIL_REDIRECT_TO` (TEST),
 *                  pour ne jamais écrire à un vrai utilisateur ;
 *   - `log`      : aucun envoi, le message est seulement logué (local, e2e).
 *                  Défaut quand la variable est absente ou vide, sauf en
 *                  production (`NODE_ENV=production`) où elle est obligatoire :
 *                  le workflow exporte une var GitHub absente en chaîne vide.
 *                  `log` explicite reste permis en production (warn au boot).
 *
 * Une valeur inconnue ou une config incomplète ne bloque jamais le démarrage
 * de l'API : le mode passe à `disabled`, une erreur listant les problèmes est
 * loguée au boot, et chaque email non envoyé est signalé (cf. MailService).
 */
@Injectable()
export class MailConfig {
  private readonly logger = new Logger(MailConfig.name);

  /** `disabled` : config invalide, aucun email n'est envoyé (cf. `problems`). */
  readonly mode: MailMode | 'disabled';
  /**
   * Raisons de la désactivation, vide sinon. Ne citent que des noms de
   * variables et la valeur de MAIL_MODE, jamais la clé Brevo.
   */
  readonly problems: readonly string[];
  /** Vide hors `send`/`redirect`. Ne jamais la loguer ni l'inclure dans une erreur. */
  readonly brevoApiKey: string;
  /** Adresse d'expéditeur (doit être un expéditeur validé côté Brevo). */
  readonly from: string;
  /** Nom d'expéditeur affiché, optionnel. */
  readonly fromName: string | undefined;
  /** Boîte de test qui reçoit tous les mails en mode `redirect`. */
  readonly redirectTo: string;

  constructor(configService: ConfigService) {
    const problems: string[] = [];
    const mode = parseMode(
      configService.get<string>('MAIL_MODE'),
      configService.get<string>('NODE_ENV') === 'production',
      problems,
    );
    this.fromName = configService.get<string>('MAIL_FROM_NAME')?.trim() || undefined;

    const sends = mode === 'send' || mode === 'redirect';
    const brevoApiKey = sends ? readRequired(configService, 'BREVO_API_KEY', mode, problems) : '';
    const from = sends ? readRequired(configService, 'MAIL_FROM', mode, problems) : '';
    const redirectTo =
      mode === 'redirect' ? readRequired(configService, 'MAIL_REDIRECT_TO', mode, problems) : '';

    this.problems = problems;
    // mode === null implique un problème déjà listé ; testé pour le typage.
    if (mode === null || problems.length > 0) {
      this.mode = 'disabled';
      this.brevoApiKey = '';
      this.from = '';
      this.redirectTo = '';
      this.logger.error(
        `Envoi d'emails désactivé, configuration mail invalide : ${problems.join(' ; ')}`,
      );
      return;
    }
    this.mode = mode;
    this.brevoApiKey = brevoApiKey;
    this.from = from;
    this.redirectTo = redirectTo;
  }
}

/** Mode lu, ou `null` (problème ajouté à `problems`) si invalide. */
function parseMode(
  raw: string | undefined,
  isProduction: boolean,
  problems: string[],
): MailMode | null {
  const value = raw?.trim() ?? '';
  if (value.length === 0) {
    if (isProduction) {
      problems.push('MAIL_MODE est obligatoire en production (send, redirect ou log)');
      return null;
    }
    return 'log';
  }
  if ((MAIL_MODES as readonly string[]).includes(value)) return value as MailMode;
  problems.push(`MAIL_MODE invalide : « ${value} ». Valeurs admises : ${MAIL_MODES.join(', ')}`);
  return null;
}

/**
 * Le problème ne cite que le nom de la variable, jamais sa valeur : il ne doit
 * en aucun cas pouvoir faire fuiter la clé Brevo dans les logs de boot.
 */
function readRequired(
  configService: ConfigService,
  key: string,
  mode: MailMode,
  problems: string[],
): string {
  const value = configService.get<string>(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    problems.push(`${key} est obligatoire et non vide quand MAIL_MODE=${mode}`);
    return '';
  }
  return value.trim();
}
