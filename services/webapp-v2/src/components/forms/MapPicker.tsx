import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Use OpenFreeMap for free 3D buildings
const STYLE_3D = 'https://tiles.openfreemap.org/styles/liberty';

// Default center: Toulouse, France
const DEFAULT_CENTER: [number, number] = [1.4442, 43.6047]; // [lng, lat]
const DEFAULT_ZOOM = 9;
const MARKER_ZOOM = 15;

interface MapPickerProps {
  value?: string; // "lat,lng" format
  onChange: (value: string) => void;
  className?: string;
}

export function MapPicker({ value, onChange, className }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [lat, lng] = value.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition({ lat, lng });
      }
    }
  }, [value]);

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter: [number, number] = position
      ? [position.lng, position.lat]
      : DEFAULT_CENTER;
    const initialZoom = position ? MARKER_ZOOM : DEFAULT_ZOOM;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE_3D,
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (position) {
      updateMarker([position.lng, position.lat]);
    }

    // Click to set marker
    map.current.on('click', e => {
      const { lng, lat } = e.lngLat;
      setPosition({ lat, lng });
      onChange(`${lat},${lng}`);
      updateMarker([lng, lat]);
      map.current?.flyTo({ center: [lng, lat], zoom: MARKER_ZOOM, duration: 1000 });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, []);

  // Update marker when position changes externally
  useEffect(() => {
    if (!map.current || !position) return;
    updateMarker([position.lng, position.lat]);
  }, [position, updateMarker]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery,
        )}&format=json&limit=1&countrycodes=fr`,
        {
          headers: {
            'User-Agent': 'OpenDossard-Backoffice',
          },
        },
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition({ lat, lng });
        onChange(`${lat},${lng}`);
        updateMarker([lng, lat]);
        map.current?.flyTo({ center: [lng, lat], zoom: MARKER_ZOOM, duration: 1500 });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setPosition(null);
    onChange('');
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  };

  return (
    <div className={className}>
      {/* Search bar */}
      <div className="mb-3 flex gap-2">
        <Input
          type="text"
          placeholder="Rechercher une adresse..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={isSearching}
          aria-label="Rechercher une adresse"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Map */}
      <div
        ref={mapContainer}
        className="relative h-[400px] w-full rounded-md border overflow-hidden"
      />

      {/* Coordinates display and clear button */}
      {position && (
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        </div>
      )}
    </div>
  );
}
