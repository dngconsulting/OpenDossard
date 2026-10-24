// Lettres sans forme décomposée NFD, que `unaccent` (Postgres) développe.
const LIGATURES: Record<string, string> = { œ: 'oe', æ: 'ae', ß: 'ss', ø: 'o', ł: 'l', đ: 'd' };

/**
 * Nom de club normalisé pour la recherche et la détection de doublons :
 * minuscules, sans accents, toute suite de caractères non alphanumériques
 * (tiret, apostrophe, point, espaces multiples) réduite à un espace.
 * « Saint-Juéry  O.C. » → « saint juery o c ».
 * À garder aligné avec `normalizedClubName` (api-v2/src/clubs/clubs.service.ts).
 */
export function normalizeClubName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[œæßøłđ]/g, c => LIGATURES[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
