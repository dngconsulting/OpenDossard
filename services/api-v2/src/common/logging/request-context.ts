import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexte propagé pendant toute la durée d'une requête HTTP.
 *
 * Stocké dans un `AsyncLocalStorage` natif (Node 18+) : aucun champ de requête
 * n'a besoin d'être passé explicitement de couche en couche. N'importe quel
 * logger ou service peut lire le `requestId` courant via {@link getRequestId}.
 */
export interface RequestStore {
  /** Identifiant unique de la requête, propagé dans tous les logs corrélés. */
  requestId: string;
  /** Renseigné après authentification (cf. HttpLoggingInterceptor). */
  userId?: number;
}

/**
 * Singleton module : partagé entre le middleware (qui ouvre le contexte) et le
 * logger (qui le lit). Volontairement instancié hors du conteneur DI pour que
 * `JsonLogger` puisse le consulter même avant que l'app NestJS ne soit prête.
 */
export const requestContext = new AsyncLocalStorage<RequestStore>();

/** Identifiant de la requête courante, ou `undefined` hors d'une requête. */
export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

/** Utilisateur authentifié de la requête courante, ou `undefined`. */
export function getUserId(): number | undefined {
  return requestContext.getStore()?.userId;
}

/**
 * Enrichit le contexte courant avec l'utilisateur authentifié.
 * No-op si appelé hors d'une requête.
 */
export function setUserId(userId: number): void {
  const store = requestContext.getStore();
  if (store) {
    store.userId = userId;
  }
}
