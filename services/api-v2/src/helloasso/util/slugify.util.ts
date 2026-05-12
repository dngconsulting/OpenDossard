/**
 * Slugifie une chaîne pour la comparer à un `organization_slug` HelloAsso.
 *
 *   "CYCLO CLUB CASTANEEN" → "cyclo-club-castaneen"
 *   "Élite Cyclistes"      → "elite-cyclistes"
 *   "Vélo & Co"            → "velo-co"
 *
 * Algorithme :
 *  1. Décompose les caractères accentués via NFD (`é` → `e` + combining acute)
 *  2. Retire les diacritiques (`\p{M}` = toutes les marques unicode)
 *  3. Met en minuscules
 *  4. Remplace toute séquence non `[a-z0-9]` par un seul tiret
 *  5. Trim les tirets en début / fin
 *
 * Convention alignée sur celle utilisée par HelloAsso pour générer ses slugs
 * d'asso (`organization_slug`) — à confirmer empiriquement au 1er essai
 * sandbox. Si HelloAsso applique des règles différentes (ex: conserver les
 * accents, traiter `&` autrement), la fonction sera à adapter à ce moment.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
