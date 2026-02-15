import type {
  RaceRowType,
  CreateEngagementDto,
  UpdateRankingDto,
  RemoveRankingDto,
} from '@/types/races';

import { apiClient } from './client';

export const racesApi = {
  /**
   * Récupère tous les engagements d'une compétition
   */
  getByCompetition: (competitionId: number): Promise<RaceRowType[]> =>
    apiClient<RaceRowType[]>(`/races/competition/${competitionId}`),

  /**
   * Engage un coureur sur une compétition
   */
  engage: (data: CreateEngagementDto): Promise<RaceRowType> =>
    apiClient<RaceRowType>('/races', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Supprime un engagement
   */
  delete: (id: number): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(`/races/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Met à jour le classement d'un coureur
   */
  updateRanking: (data: UpdateRankingDto): Promise<RaceRowType> =>
    apiClient<RaceRowType>('/races/ranking', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Retire un coureur du classement
   */
  removeRanking: (data: RemoveRankingDto): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>('/races/ranking/remove', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Toggle le flag sprint challenge
   */
  toggleChallenge: (id: number): Promise<RaceRowType> =>
    apiClient<RaceRowType>(`/races/${id}/challenge`, {
      method: 'PUT',
    }),

  /**
   * Met à jour le chrono
   */
  updateChrono: (id: number, chrono: string): Promise<RaceRowType> =>
    apiClient<RaceRowType>(`/races/${id}/chrono`, {
      method: 'PATCH',
      body: JSON.stringify({ chrono }),
    }),

  /**
   * Met à jour les tours
   */
  updateTours: (id: number, tours: number | null): Promise<RaceRowType> =>
    apiClient<RaceRowType>(`/races/${id}/tours`, {
      method: 'PATCH',
      body: JSON.stringify({ tours }),
    }),

  /**
   * Réordonne les classements manuellement (drag & drop)
   * Note: Le backend détermine le rang à partir de la position dans le tableau
   */
  reorderRankings: (items: { id: number; comment?: string | null }[]): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>('/races/ranking/reorder', {
      method: 'PUT',
      body: JSON.stringify(items),
    }),

  /**
   * Upload d'un fichier CSV de résultats pour une compétition
   */
  uploadResultsCsv: (competitionId: number, file: File): Promise<{ processed: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<{ processed: number; errors: string[] }>(
      `/races/results/upload/${competitionId}`,
      {
        method: 'POST',
        body: formData,
      },
    );
  },
};
