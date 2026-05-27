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
  signatureKeys: string[],
  headers: Record<string, string | string[] | undefined>,
): boolean {
  if (!rawBody || rawBody.length === 0) {
    return false;
  }
  const received = extractSignatureHeader(headers);
  if (!received) {
    return false;
  }

  // Signature reçue décodée une seule fois (Buffer.from hex ne throw pas : un
  // hex invalide produit un buffer tronqué → longueur ≠ → rejet plus bas).
  const a = Buffer.from(received, 'hex');

  // Try-both : la prod HelloAsso émet une signatureKey DISTINCTE par type de
  // notification (Payment ≠ Organization). On accepte si la signature matche
  // AU MOINS une des clés configurées. Comparaison timing-safe par clé.
  return signatureKeys.some(key => {
    if (!key) {
      return false;
    }
    const computed = createHmac('sha256', key).update(rawBody).digest('hex');
    const b = Buffer.from(computed, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  });
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
