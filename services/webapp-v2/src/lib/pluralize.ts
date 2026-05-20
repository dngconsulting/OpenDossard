/**
 * Concatène un nombre et un nom au pluriel français basique (ajoute `s` au-delà
 * de 1). Convient aux mots simples (`club`, `licence`, `participant`).
 *
 * Pour des pluriels irréguliers ou de l'i18n, basculer sur `Intl.PluralRules`.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count <= 1) {return `${count} ${singular}`;}
  return `${count} ${plural ?? `${singular}s`}`;
}
