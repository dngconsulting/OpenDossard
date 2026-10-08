import { useQuery } from '@tanstack/react-query';

import { gpxTracesApi } from '@/api/gpx-traces.api';

/**
 * Tracé calculé d'un GPX déposé (nom, polyline, statistiques), partagé entre
 * le champ du circuit et l'aperçu : chargé une seule fois.
 */
export function useGpxTrack(
  competitionId: number | undefined,
  gpxTraceId: string | null | undefined,
) {
  return useQuery({
    queryKey: ['gpx-traces', competitionId, gpxTraceId],
    queryFn: () => gpxTracesApi.getTrack(competitionId!, gpxTraceId!),
    enabled: competitionId != null && !!gpxTraceId,
    // Un tracé ne change jamais : un nouveau dépôt a un nouvel id.
    staleTime: Infinity,
  });
}
