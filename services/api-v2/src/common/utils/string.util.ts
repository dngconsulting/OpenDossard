/**
 * Tronque une chaîne à `max` caractères maximum (caractère ellipsis compris).
 * Si `s.length > max`, retourne `s.slice(0, max - 1) + '…'`. Sinon retourne
 * `s` tel quel.
 *
 * **Sémantique stricte** : la longueur du résultat est garantie `<= max`.
 * Utilisable pour respecter des limites d'API (ex: HelloAsso `itemName` ≤ 250 chars)
 * comme pour la troncature de logs (lisibilité).
 */
export function truncate(s: string, max: number): string {
  if (max <= 0) return '';
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
