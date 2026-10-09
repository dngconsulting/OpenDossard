import type { GpxTracePayload, GpxTraceSummary } from '@/types/gpx-traces';

import { apiClient, apiFetchBlob } from './client';

export const gpxTracesApi = {
  /** Calcul du profil côté serveur (altimétrie IGN) : compter jusqu'à ~15 s pour 200 km. */
  upload: (competitionId: number, file: File, signal?: AbortSignal): Promise<GpxTraceSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<GpxTraceSummary>(`/competitions/${competitionId}/gpx-traces`, {
      method: 'POST',
      body: formData,
      signal,
    });
  },

  /** Tracé calculé (servi compressé, décompressé par le navigateur). */
  getTrack: (competitionId: number, gpxTraceId: string): Promise<GpxTracePayload> =>
    apiClient<GpxTracePayload>(`/competitions/${competitionId}/gpx-traces/${gpxTraceId}`),

  downloadGpx: (competitionId: number, gpxTraceId: string): Promise<Blob> =>
    apiFetchBlob(`/competitions/${competitionId}/gpx-traces/${gpxTraceId}/gpx`),
};
