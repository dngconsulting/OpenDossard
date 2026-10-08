export interface CompetitionInfo {
  course: string;
  horaireEngagement?: string;
  horaireDepart?: string;
  info1?: string;
  info2?: string;
  /** Lien du parcours, ouvert dans le navigateur ; jamais en même temps qu'un `gpxTraceId`. */
  info3?: string;
  /**
   * GPX déposé du circuit (`competition_gpx_trace.id`, affiché dans l'app), stable si
   * les circuits sont réordonnés ; jamais en même temps qu'un lien `info3`.
   */
  gpxTraceId?: string;
}
