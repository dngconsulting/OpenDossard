/* eslint-disable import/order */
import { useState, useEffect } from 'react';
import { LatLng, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix default marker icon issue in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, X, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  value?: string; // "lat,lng" format
  onChange: (value: string) => void;
  className?: string;
}

interface LocationMarkerProps {
  position: LatLng | null;
  setPosition: (position: LatLng) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15, { duration: 1 });
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export function MapPicker({ value, onChange, className }: MapPickerProps) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [lat, lng] = value.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition(new LatLng(lat, lng));
      }
    }
  }, [value]);

  // Update form value when position changes
  useEffect(() => {
    if (position) {
      onChange(`${position.lat},${position.lng}`);
    }
  }, [position, onChange]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'OpenDossard-Backoffice',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPosition = new LatLng(parseFloat(lat), parseFloat(lon));
        setPosition(newPosition);
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
  };

  // Default center: Toulouse, France
  const defaultCenter: [number, number] = [43.6047, 1.4442];
  const defaultZoom = 9;

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
      <div className="relative h-[400px] w-full rounded-md border overflow-hidden">
        <MapContainer
          center={position ? [position.lat, position.lng] : defaultCenter}
          zoom={position ? 15 : defaultZoom}
          className="h-full w-full"
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>

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
