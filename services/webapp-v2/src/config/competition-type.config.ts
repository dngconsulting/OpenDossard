import { Bike, TreePine, Mountain, Route, MapPinned, type LucideIcon } from 'lucide-react';

export const COMPETITION_TYPE_ICONS: Record<string, LucideIcon> = {
  ROUTE: Bike,
  CX: TreePine,
  VTT: Mountain,
  GRAVEL: Route,
  RANDO: MapPinned,
};
