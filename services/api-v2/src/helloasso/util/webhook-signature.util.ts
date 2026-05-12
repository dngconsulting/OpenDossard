import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Vérification HMAC-SHA256 d'un webhook HelloAsso.
 *
 *   HMAC-SHA256(rawBody, signatureKey) === toHex(headers['x-ha-signature'])
 *
 * `signatureKey` est la clé opaque retournée par HelloAsso lors de
 * l'enregistrement de l'URL webhook (PUT /v5/partners/me/api-notifications).
 * `rawBody` doit être le buffer **exact** reçu sur la wire (avant toute
 * normalisation/parsing). Comparaison timing-safe.
 *
 * Documentation HelloAsso :
 *   - Header : `x-ha-signature`
 *   - Format : lowercase hex
 *   - Reserved to partners
 *
 * @param rawBody Bytes bruts du body de la requête HTTP
 * @param signatureKey Clé partagée (string opaque HelloAsso)
 * @param headers Headers HTTP de la requête (case-insensitive lookup)
 * @returns true ssi la signature est valide
 */
export function verifyHelloAssoSignature(
  rawBody: Buffer | undefined,
  signatureKey: string,
  headers: Record<string, string | string[] | undefined>,
): boolean {
  if (!rawBody || rawBody.length === 0) {
    return false;
  }
  const received = extractSignatureHeader(headers);
  if (!received) {
    return false;
  }

  const computed = createHmac('sha256', signatureKey).update(rawBody).digest('hex');

  // Convertit en Buffer pour comparaison timing-safe (longueurs doivent matcher).
  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(received, 'hex');
    b = Buffer.from(computed, 'hex');
  } catch {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function extractSignatureHeader(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  // HTTP headers sont case-insensitive ; Node les normalise en lowercase côté req.headers,
  // mais on défense en profondeur en cherchant les 2 casses possibles.
  const raw = headers['x-ha-signature'] ?? headers['X-HA-Signature' as keyof typeof headers];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}
