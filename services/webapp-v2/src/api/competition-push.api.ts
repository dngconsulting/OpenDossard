import { apiClient } from './client';

/** Cibles d'un push AVANT envoi (popup de confirmation). */
export interface CompetitionPushTargets {
  targetedUsers: number;
}

/** Stats renvoyées APRÈS envoi. */
export interface CompetitionPushResult {
  targetedUsers: number;
  sentDevices: number;
}

/**
 * Push organisateur vers les abonnés (starreurs) d'une épreuve.
 * Endpoints réservés ADMIN/ORGANISATEUR, scopés club côté backend.
 */
export const competitionPushApi = {
  getTargets: (competitionId: number): Promise<CompetitionPushTargets> =>
    apiClient<CompetitionPushTargets>(`/competitions/${competitionId}/push/targets`),

  send: (competitionId: number, message: string): Promise<CompetitionPushResult> =>
    apiClient<CompetitionPushResult>(`/competitions/${competitionId}/push`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
