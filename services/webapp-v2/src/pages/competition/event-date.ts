/**
 * La date d'une épreuve est saisie sans heure : les heures utiles sont celles
 * des départs (onglet Horaires & Circuits). L'API attend néanmoins un instant
 * complet ; on lui envoie la date choisie à cette heure technique.
 *
 * Midi, et non minuit : l'instant est sérialisé en UTC (`…Z`), et l'app
 * Dossardeur comme les filtres SQL de l'API en lisent le jour par découpage
 * (`slice(0, 10)`, `DATE(event_date)`). À 00:00:01 heure de Paris, l'instant UTC
 * tombe la veille (22 h ou 23 h) et l'épreuve s'afficherait un jour trop tôt.
 */
const EVENT_DATE_TIME = '12:00:00';

/** Instant ISO renvoyé par l'API → `YYYY-MM-DD` (jour local) pour le champ date. */
export function toEventDateInput(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {return '';}
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD` saisi dans le champ date → instant ISO envoyé à l'API. */
export function toEventDateIso(dateInput: string): string {
  return new Date(`${dateInput}T${EVENT_DATE_TIME}`).toISOString();
}
