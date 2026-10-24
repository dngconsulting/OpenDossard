import { Logger } from '@nestjs/common';

/** Fenêtre du throttle des routes forgot/reset-password (ms, @nestjs/throttler v6). */
export const PASSWORD_RESET_THROTTLE_TTL_MS = 15 * 60 * 1000;
export const PASSWORD_RESET_THROTTLE_DEFAULT_LIMIT = 5;

/**
 * PASSWORD_RESET_THROTTLE_LIMIT est réservé à l'e2e (relève la limite, toutes
 * les requêtes de test partageant la même IP). Absente → 5. Une valeur non
 * entière ou ≤ 0 n'empêche pas l'API de démarrer : erreur loguée et repli sur
 * 5, le throttle n'est jamais désactivé.
 */
export function parseThrottleLimit(raw: string | undefined): number {
  if (raw === undefined) return PASSWORD_RESET_THROTTLE_DEFAULT_LIMIT;
  const value = raw.trim();
  const limit = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(limit) || limit <= 0) {
    new Logger('PasswordResetThrottle').error(
      `PASSWORD_RESET_THROTTLE_LIMIT invalide : « ${raw} » (entier strictement positif attendu), ` +
        `repli sur ${PASSWORD_RESET_THROTTLE_DEFAULT_LIMIT}`,
    );
    return PASSWORD_RESET_THROTTLE_DEFAULT_LIMIT;
  }
  return limit;
}
