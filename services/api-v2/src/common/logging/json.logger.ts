import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { getRequestId, getUserId } from './request-context';

/**
 * Niveaux NestJS → sévérité normalisée (exploitable par journald/Netdata).
 */
const LEVEL_MAP: Record<LogLevel, string> = {
  log: 'info',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
  verbose: 'trace',
  fatal: 'fatal',
};

/**
 * Logger applicatif unique de l'API.
 *
 * - En production (NODE_ENV !== 'development') : une ligne **JSON par log** sur
 *   stdout, avec `time/level/context/requestId/userId/msg`. Ce format est conçu
 *   pour être ingéré par `log2journal` (Netdata) → chaque clé JSON devient un
 *   champ filtrable/triable dans le Logs Explorer.
 * - En développement : on délègue à `ConsoleLogger` (sortie colorée familière),
 *   en suffixant le contexte d'un `requestId` court pour garder la corrélation
 *   visible en local.
 *
 * Branché via `app.useLogger(...)` dans `main.ts` : tous les `new Logger(ctx)`
 * existants passent automatiquement par ce logger, sans modification.
 */
@Injectable()
export class JsonLogger extends ConsoleLogger {
  private readonly pretty = process.env.NODE_ENV === 'development';

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('log', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('fatal', message, optionalParams);
  }

  private emit(level: LogLevel, message: unknown, params: unknown[]): void {
    const { context, stack } = this.parseParams(level, params);
    const structured = this.isPlainObject(message);

    if (this.pretty) {
      const requestId = getRequestId();
      const ctx = requestId ? `${context ?? ''} req=${requestId.slice(0, 8)}`.trim() : context;
      const text = structured
        ? ((message as Record<string, unknown>).msg ?? JSON.stringify(message))
        : message;
      // Délègue au rendu coloré de ConsoleLogger (stack pris en charge pour error).
      const extra = stack ? [stack, ctx] : [ctx];
      (super[level] as (m: unknown, ...p: unknown[]) => void)(text, ...extra);
      return;
    }

    // Champs métier d'un message-objet (ex: HTTP method/url/status) fusionnés
    // en clés de premier niveau → champs filtrables/triables dans Netdata.
    const base = structured
      ? { ...(message as Record<string, unknown>) }
      : { msg: this.serializeMessage(message) };

    const entry: Record<string, unknown> = {
      ...base,
      time: new Date().toISOString(),
      level: LEVEL_MAP[level],
      context: context ?? this.context,
      requestId: getRequestId(),
      userId: getUserId(),
      ...(stack ? { stack } : {}),
    };
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }

  private isPlainObject(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Error)
    );
  }

  /**
   * Démêle les `optionalParams` hétérogènes de l'API NestJS Logger :
   *  - `log(msg, context)`
   *  - `error(msg, stack, context)` / `error(msg, stack)` / `error(msg, context)`
   */
  private parseParams(level: LogLevel, params: unknown[]): { context?: string; stack?: string } {
    const strings = params.filter((p): p is string => typeof p === 'string');
    if (level !== 'error' && level !== 'fatal') {
      return { context: strings[strings.length - 1] };
    }
    if (strings.length >= 2) {
      return { stack: strings[0], context: strings[strings.length - 1] };
    }
    if (strings.length === 1) {
      // Un seul string : c'est une stack s'il est multi-ligne, sinon un contexte.
      return strings[0].includes('\n') ? { stack: strings[0] } : { context: strings[0] };
    }
    return {};
  }

  private serializeMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
