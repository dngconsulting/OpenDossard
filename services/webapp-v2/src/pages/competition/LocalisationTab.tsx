import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import 'maplibre-gl/dist/maplibre-gl.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { FormValues } from './types';

// Default center: Toulouse
const DEFAULT_LAT = 43.604652;
const DEFAULT_LNG = 1.444209;
const DEFAULT_ZOOM = 5;
const MARKER_ZOOM = 15;

// Map styles
const STYLE_STREETS = 'https://tiles.openfreemap.org/styles/liberty';
const STYLE_SATELLITE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export function LocalisationTab() {
  const form = useFormContext<FormValues>();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const watchedGPS = form.watch('lieuDossardGPS');

  const parseCoordinates = useCallback((gpsString: string | undefined): [number, number] | null => {
    if (!gpsString) {
      return null;
    }
    const parts = gpsString.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[1], parts[0]]; // MapLibre uses [lng, lat]
    }
    return null;
  }, []);

  const updateMarker = useCallback((lngLat: [number, number]) => {
    if (!map.current) return;

    if (marker.current) {
      marker.current.setLngLat(lngLat);
    } else {
      marker.current = new maplibregl.Marker({ color: '#047857' })
        .setLngLat(lngLat)
        .addTo(map.current);
    }
  }, []);

  const setCoordinatesFromLngLat = useCallback(
    (lng: number, lat: number) => {
      const gpsValue = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      form.setValue('lieuDossardGPS', gpsValue, { shouldDirty: true });
      updateMarker([lng, lat]);
    },
    [form, updateMarker],
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCoords = parseCoordinates(watchedGPS);

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE_STREETS,
      center: initialCoords || [DEFAULT_LNG, DEFAULT_LAT],
      zoom: initialCoords ? MARKER_ZOOM : DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      maxPitch: 85,
    });

    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    if (initialCoords) {
      updateMarker(initialCoords);
    }

    // Double-click to set marker
    map.current.on('dblclick', e => {
      e.preventDefault();
      setCoordinatesFromLngLat(e.lngLat.lng, e.lngLat.lat);
    });

    // Disable double-click zoom
    map.current.doubleClickZoom.disable();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, []);

  // Update marker when GPS field changes
  useEffect(() => {
    if (!map.current) return;

    const coords = parseCoordinates(watchedGPS);
    if (coords) {
      updateMarker(coords);
    } else if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  }, [watchedGPS, parseCoordinates, updateMarker]);

  // Toggle 3D view
  const toggle3D = useCallback(() => {
    if (!map.current) return;

    if (is3D) {
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    } else {
      map.current.easeTo({ pitch: 60, bearing: -20, duration: 1000 });
    }
    setIs3D(!is3D);
  }, [is3D]);

  // Toggle satellite view
  const toggleSatellite = useCallback(() => {
    if (!map.current) return;

    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    const currentPitch = map.current.getPitch();
    const currentBearing = map.current.getBearing();

    const newStyle = isSatellite ? STYLE_STREETS : STYLE_SATELLITE;
    map.current.setStyle(newStyle);

    // Restore position after style change
    map.current.once('style.load', () => {
      map.current?.setCenter(currentCenter);
      map.current?.setZoom(currentZoom);
      map.current?.setPitch(currentPitch);
      map.current?.setBearing(currentBearing);

      // Re-add marker if it exists
      const coords = parseCoordinates(watchedGPS);
      if (coords && map.current) {
        if (marker.current) {
          marker.current.remove();
        }
        marker.current = new maplibregl.Marker({ color: '#047857' })
          .setLngLat(coords)
          .addTo(map.current);
      }
    });

    setIsSatellite(!isSatellite);
  }, [isSatellite, watchedGPS, parseCoordinates]);

  // Search for location using Nominatim (OpenStreetMap)
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=fr&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  const selectSearchResult = useCallback(
    (result: any) => {
      const lng = parseFloat(result.lon);
      const lat = parseFloat(result.lat);

      if (map.current) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: MARKER_ZOOM,
          duration: 1500,
        });
      }

      setCoordinatesFromLngLat(lng, lat);
      setSearchResults([]);
      setSearchQuery('');
    },
    [setCoordinatesFromLngLat],
  );

  return (
    <Card className="rounded-t-none border-t-0">
      <CardHeader className="pt-4">
        <CardTitle>
          <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
            Localisation
          </span>
        </CardTitle>
        <CardDescription>
          Indiquez le lieu de retrait des dossards et les coordonnées GPS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lieuDossard"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lieu de retrait des dossards</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Salle des fêtes de Lombez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lieuDossardGPS"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coordonnées GPS</FormLabel>
                <FormControl>
                  <Input placeholder="ex: 43.4731, 0.9114" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher une ville ou adresse..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </Button>
            <Button type="button" variant={is3D ? 'default' : 'outline'} onClick={toggle3D}>
              3D
            </Button>
            <Button type="button" variant={isSatellite ? 'default' : 'outline'} onClick={toggleSatellite}>
              Satellite
            </Button>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                  onClick={() => selectSearchResult(result)}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-[450px] w-full rounded-lg overflow-hidden border" ref={mapContainer} />

        <p className="text-sm text-muted-foreground text-center">
          Recherchez une ville ou double-cliquez sur la carte pour définir les coordonnées GPS.
          Utilisez le bouton 3D pour activer la vue en relief.{' '}
          <strong>N'oubliez pas d'enregistrer !</strong>
        </p>
      </CardContent>
    </Card>
  );
}
