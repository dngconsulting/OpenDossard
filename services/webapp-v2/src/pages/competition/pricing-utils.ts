/**
 * Parse une valeur de tarif (string | number) en euros.
 * Accepte `12,50` / `12.50` / `12,3` / `12` / number direct.
 * Renvoie `undefined` si vide, non parsable, ou ≤ 0.
 */
export function parseTarifAmount(tarif: string | number | undefined): number | undefined {
  if (typeof tarif === 'number') {
    return Number.isFinite(tarif) && tarif > 0 ? tarif : undefined;
  }
  if (typeof tarif !== 'string') {return undefined;}
  const cleaned = tarif.trim().replace(',', '.');
  if (!cleaned) {return undefined;}
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Format pour input contrôlé : `8,5` (préserve séparateur français, pas de €). */
export function tarifToInput(tarif: string | number | undefined): string {
  if (tarif == null) {return '';}
  if (typeof tarif === 'number') {return String(tarif).replace('.', ',');}
  return tarif;
}

/** Format pour affichage tableau : `8,00 €` si number, sinon string telle quelle. */
export function tarifToDisplay(tarif: string | number | undefined): string {
  if (tarif == null) {return '';}
  if (typeof tarif === 'number') {
    return (
      tarif.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      ' €'
    );
  }
  return tarif;
}
