import { Bike, Hash, MapPin, Shield, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { LicenceType } from '@/types/licences';

type Props = {
  licence: LicenceType;
};

export function RiderHeaderCard({ licence }: Props) {
  const initials = `${(licence.firstName?.[0] ?? '').toUpperCase()}${(licence.name?.[0] ?? '').toUpperCase()}`;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-center gap-5">
        {/* Avatar */}
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xl font-bold tracking-wide shrink-0">
          {initials}
        </div>

        {/* Name + club */}
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-2xl font-bold tracking-tight">
            {licence.name} <span className="font-normal text-muted-foreground">{licence.firstName}</span>
          </h2>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span>{licence.club || 'Club inconnu'}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Shield className="h-3 w-3" />
            {licence.fede}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Hash className="h-3 w-3" />
            {licence.licenceNumber}
          </Badge>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-3 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <Bike className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Route</span>
          <Badge variant="secondary" className="text-xs font-semibold">
            {licence.catev || 'N/A'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Bike className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">CX</span>
          <Badge variant="secondary" className="text-xs font-semibold">
            {licence.catevCX || 'N/A'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Âge</span>
          <Badge variant="secondary" className="text-xs font-semibold">
            {licence.catea || 'N/A'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
