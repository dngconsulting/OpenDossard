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
