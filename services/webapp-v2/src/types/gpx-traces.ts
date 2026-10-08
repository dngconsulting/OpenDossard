/** Résumé d'un tracé GPX déposé, renvoyé par l'API (jamais le tracé lui-même). */
export type GpxTraceSummary = {
  id: string;
  name: string | null;
  /** Mètres. */
  distance: number;
  ascent: number;
  descent: number;
  minElevation: number;
  maxElevation: number;
  pointCount: number;
  /** `ign` : altitudes RGE ALTI ; `gpx` : celles du fichier ; `none` : aucune. */
  elevationSource: 'ign' | 'gpx' | 'none';
};

/** Tracé prêt à afficher (`GET /competitions/:id/gpx-traces/:gpxTraceId`), champs utilisés. */
export type GpxTracePayload = {
  name: string | null;
  /** Sommets du tracé, polyline Google précision 5. */
  polyline: string;
  stats: { distance: number; ascent: number };
};
