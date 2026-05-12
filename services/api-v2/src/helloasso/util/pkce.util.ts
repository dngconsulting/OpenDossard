import { createHash, randomBytes } from 'node:crypto';

/**
 * PKCE (RFC 7636) — méthode S256 exclusivement (HelloAsso ne supporte pas `plain`).
 *
 *   code_verifier  : 43–128 caractères dans [A-Z a-z 0-9 - . _ ~]
 *   code_challenge : base64url(SHA256(code_verifier)) sans padding
 *
 * Le verifier est généré côté backend et conservé en cache jusqu'à l'échange
 * du authorization_code. Il ne transite JAMAIS via le navigateur.
 */

const VERIFIER_LENGTH = 64;

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

export function generatePkcePair(): PkcePair {
  const codeVerifier = randomBytes(VERIFIER_LENGTH).toString('base64url').slice(0, 96);
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

/**
 * State opaque pour la mire d'autorisation (anti-CSRF + clé de lookup côté
 * serveur dans le HelloAssoStateStore). 32 octets de hasard = 256 bits, encodé
 * base64url ⇒ 43 caractères, bien en deçà de la limite HelloAsso (500).
 */
export function generateState(): string {
  return randomBytes(32).toString('base64url');
}
