import { Loader2 } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGpxTrack } from '@/hooks/useGpxTraces';

type GpxTracePreviewDialogProps = {
  competitionId: number;
  open: boolean;
  /**
   * Tracé à afficher, conservé à la fermeture : il reste visible pendant
   * l'animation de fermeture au lieu de laisser place au chargement.
   */
  gpxTraceId: string | null;
  onClose: () => void;
};

/**
 * Plan clair OpenFreeMap Positron (gratuit, sans clé, même fournisseur que la
 * carte de l'onglet Lieu) : seul le tracé est en couleur.
 */
const BASE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** Couleur vive : le tracé ressort sur le plan gris. */
const TRACE_COLOR = '#e11d48';
const kmFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const metersFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** Polyline Google précision 5 (format du tracé servi par l'API) → `[lon, lat]`. */
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lon += next();
    coordinates.push([lon / 1e5, lat / 1e5]);
  }
  return coordinates;
}

/**
 * Aperçu d'un GPX déposé : le tracé calculé par le serveur sur un plan
 * clair, pour vérifier que le bon fichier a été déposé.
 */
export function GpxTracePreviewDialog({
  competitionId,
  open,
  gpxTraceId,
  onClose,
}: GpxTracePreviewDialogProps) {
  const { data, isError } = useGpxTrack(competitionId, gpxTraceId);
  // Conteneur de la carte, monté par la fenêtre une fois ouverte.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container || !data) {
      return;
    }
    const coordinates = decodePolyline(data.polyline);
    const bounds = coordinates.reduce(
      (box, coordinate) => box.extend(coordinate),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
    );
    const map = new maplibregl.Map({
      container,
      style: BASE_MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 40 },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      map.addSource('gpx-trace', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } },
      });
      // Liseré blanc sous le tracé : lisible quand il suit une route.
      map.addLayer({
        id: 'gpx-trace-casing',
        type: 'line',
        source: 'gpx-trace',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 8 },
      });
      map.addLayer({
        id: 'gpx-trace',
        type: 'line',
        source: 'gpx-trace',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': TRACE_COLOR, 'line-width': 4.5 },
      });
    });
    // Départ et arrivée : le sens du parcours se vérifie d'un coup d'œil.
    new maplibregl.Marker({ color: '#047857' }).setLngLat(coordinates[0]).addTo(map);
    new maplibregl.Marker({ color: '#1f2937' })
      .setLngLat(coordinates[coordinates.length - 1])
      .addTo(map);
    return () => map.remove();
  }, [container, data]);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Aperçu du parcours{data?.name ? ` : ${data.name}` : ''}</DialogTitle>
          <DialogDescription>
            {data
              ? `${kmFormat.format(data.stats.distance / 1000)} km · D+ ${metersFormat.format(data.stats.ascent)} m · départ en vert, arrivée en noir`
              : 'Tracé tel qu’il sera affiché dans l’application Dossardeur.'}
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] overflow-hidden rounded-md border">
          {data ? (
            <div ref={setContainer} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isError ? (
                'Le tracé n’a pas pu être chargé.'
              ) : (
                <Loader2 className="h-6 w-6 animate-spin" />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
