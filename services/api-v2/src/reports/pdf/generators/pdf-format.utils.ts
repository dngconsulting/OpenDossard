const DATE_FR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** « dimanche 15 mars 2026 » (fuseau du serveur, comme l'ancienne implémentation). */
export function formatDateFr(date: string | Date): string {
  return DATE_FR.format(typeof date === 'string' ? new Date(date) : date);
}

/** Met la première lettre en majuscule. */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Longueur du circuit, saisie libre côté webapp (« 5 », « 5km », « 45/80 km »…) :
 * l'unité n'est ajoutée que si l'organisateur ne l'a pas déjà mise.
 */
export function formatCircuitLength(value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  return /^\d+([.,]\d+)?$/.test(trimmed) ? `${trimmed} km` : trimmed;
}
