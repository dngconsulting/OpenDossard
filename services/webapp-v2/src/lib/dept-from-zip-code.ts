/**
 * Déduit le code département d'un code postal français.
 * - Outre-mer (97x, 98x) : 3 caractères (ex: 97100 → 971)
 * - Corse : 20000-20199 → 2A, 20200-20299 → 2B
 * - Sinon : 2 premiers chiffres
 * Retourne '' si le code postal est incomplet.
 */
export function deptFromZipCode(zipCode: string | undefined | null): string {
  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    return '';
  }
  if (zipCode.startsWith('97') || zipCode.startsWith('98')) {
    return zipCode.substring(0, 3);
  }
  if (zipCode.startsWith('20')) {
    return Number(zipCode) < 20200 ? '2A' : '2B';
  }
  return zipCode.substring(0, 2);
}
