import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Chiffrement AES-256-GCM pour les tokens HelloAsso au repos.
 *
 * Format de sortie : `iv.authTag.ciphertext` (3 segments base64url).
 *  - iv : 12 octets (96 bits) — recommandé pour GCM, généré aléatoirement
 *    à chaque appel (jamais réutilisé avec la même clé)
 *  - authTag : 16 octets (default GCM)
 *  - ciphertext : taille variable
 *
 * Clé : 32 octets exactement (AES-256). Fournie sous forme `Buffer` au helper.
 * Le décodage base64 → Buffer + validation de longueur se fait dans
 * `HelloAssoConfig` au boot.
 *
 * Si la clé tourne (rotation), il faudra rechiffrer toutes les lignes
 * existantes — pas géré ici (one-shot crypto, pas de versioning de clé).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encryptToken(plaintext: string, key: Buffer): string {
  assertKeyLength(key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function decryptToken(payload: string, key: Buffer): string {
  assertKeyLength(key);
  const parts = payload.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, 'base64url');
  const authTag = Buffer.from(tagB64, 'base64url');
  const ciphertext = Buffer.from(ctB64, 'base64url');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

function assertKeyLength(key: Buffer): void {
  if (key.length !== 32) {
    throw new Error(`HelloAsso encryption key must be 32 bytes, got ${key.length}`);
  }
}
