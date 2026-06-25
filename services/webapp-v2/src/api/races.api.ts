import type {
  RaceRowType,
  CreateEngagementDto,
  UpdateRankingDto,
  RemoveRankingDto,
} from '@/types/races';

import { apiClient } from './client';

export type ImportEngagesFieldDiff = {
  field: string;
  csv?: string;
  db?: string;
};

export type ImportEngagesAnomaly = {
  line: number;
  kind: 'missing' | 'divergent' | 'dossardCollision';
  licenceNumber?: string;
  rider?: string;
  missingFields?: string[];
  diffs?: ImportEngagesFieldDiff[];
  message?: string;
};

export type ImportEngagesResult = {
  summary: {
    total: number;
    inserted: number;
    duplicates: number;
    unknownLicences: number;
    anomalies: number;
  };
  details: {
    inserted: Array<{
      line: number;
      riderNumber?: number;
      rider: string;
      licenceNumber: string;
      raceCode: string;
    }>;
    duplicates: Array<{
      line: number;
      rider: string;
      licenceNumber: string;
      raceCode: string;
      existingRaceCode: string;
    }>;
    unknownLicences: Array<{
      line: number;
      licenceNumber: string;
      rider: string;
    }>;
    anomalies: ImportEngagesAnomaly[];
  };
};

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
   * Désengage en masse (suppression atomique côté serveur)
   */
  bulkDelete: (data: { ids: number[]; competitionId: number }): Promise<{ success: boolean; count: number }> =>
    apiClient<{ success: boolean; count: number }>('/races/bulk-delete', {
      method: 'POST',
      body: JSON.stringify(data),
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
   * Déclasse en masse (retrait + renumérotation atomiques côté serveur)
   */
  bulkRemoveRanking: (data: {
    ids: number[];
    raceCode: string;
    competitionId: number;
  }): Promise<{ success: boolean; count: number }> =>
    apiClient<{ success: boolean; count: number }>('/races/ranking/remove-bulk', {
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

  /**
   * Import engagés depuis un CSV exporté par OpenDossard pour une compétition
   */
  importEngages: (competitionId: number, file: File): Promise<ImportEngagesResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<ImportEngagesResult>(`/races/import/${competitionId}`, {
      method: 'POST',
      body: formData,
    });
  },
};
