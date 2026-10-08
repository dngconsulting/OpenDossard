/**
 * Pages de partage publiques (`/app/*`, servies par `DeepLinksController`) :
 * même hôte que les liens partagés par l'app Dossardeur, qui l'ouvre
 * directement quand elle est installée.
 */
export const PUBLIC_APP_LINK_BASE = 'https://app-v2.opendossard.com/app';

/** Page publique du parcours d'un circuit (GPX déposé, affiché dans l'app). */
export function gpxTraceShareUrl(competitionId: number, circuitIndex: number): string {
  return `${PUBLIC_APP_LINK_BASE}/epreuve/${competitionId}/parcours/${circuitIndex}`;
}
