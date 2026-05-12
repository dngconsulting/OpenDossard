import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HelloAssoConfig } from './helloasso.config';

export interface OAuthStateEntry {
  /**
   * ID du user OpenDossard qui a initié la liaison — conservé pour l'audit
   * `linked_by_user_id` à la persistance. Le callback n'authentifie PAS ce
   * userId (route PUBLIC) : c'est le `state` lui-même qui sert de preuve
   * d'identité (random 256-bit, single-use, TTL court, émis uniquement par
   * `prepareAuthorization` derrière JWT). Inforgeable et non-rejouable.
   *
   * Pas de `clubId` ici : c'est HelloAsso qui révèle l'organisation à laquelle
   * le user a accordé l'accès (via `organization_slug` retourné au token
   * exchange). Le matching slug → ClubEntity est fait par le caller en aval.
   */
  userId: number;
  /** PKCE verifier conservé jusqu'à l'échange code → tokens. */
  codeVerifier: string;
  /** Epoch ms — pour expiration. */
  createdAt: number;
}

/**
 * Cache in-memory du state OAuth HelloAsso.
 *
 * **Pourquoi pas de DB / Redis** : la fenêtre d'utilisation est courte (le
 * temps que l'admin clique "autoriser" puis redirige), TTL ~10 min. Un Map
 * suffit en single-replica. Si on scale-out, migrer vers une table dédiée
 * (`helloasso_oauth_state`) ou Redis — l'interface reste la même.
 *
 * **Single-use** : `consume(state)` retire l'entrée. Tout replay du callback
 * avec le même state échoue → protection anti-rejeu.
 *
 * **Cleanup** : lazy — on purge les entrées expirées à chaque opération.
 * Pas de timer global qui empêcherait le process Node de quitter en e2e.
 */
@Injectable()
export class HelloAssoStateStore {
  private readonly logger = new Logger(HelloAssoStateStore.name);
  private readonly entries = new Map<string, OAuthStateEntry>();

  constructor(private readonly config: HelloAssoConfig) {}

  put(state: string, entry: Omit<OAuthStateEntry, 'createdAt'>): void {
    this.purgeExpired();
    this.entries.set(state, { ...entry, createdAt: Date.now() });
  }

  /**
   * Récupère l'entrée associée au state ET la retire (single-use).
   * Lance UnauthorizedException si state inconnu ou expiré.
   */
  consume(state: string): OAuthStateEntry {
    this.purgeExpired();
    const entry = this.entries.get(state);
    if (!entry) {
      this.logger.warn(`consume: state not found or expired`);
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }
    this.entries.delete(state);
    return entry;
  }

  /** Pour tests / debug uniquement. */
  size(): number {
    return this.entries.size;
  }

  private purgeExpired(): void {
    const cutoff = Date.now() - this.config.stateTtlSeconds * 1000;
    for (const [key, entry] of this.entries) {
      if (entry.createdAt < cutoff) {
        this.entries.delete(key);
      }
    }
  }
}
