import { useState } from 'react';
import { startOfYear } from 'date-fns';
import type { DashboardChartFilters } from '@/types/dashboard';

export type DashboardFilterState = {
  startDate: Date | undefined;
  endDate: Date | undefined;
  fedes: string[];
  competitionTypes: string[];
  competitionDepts: string[];
  riderDepts: string[];
  clubs: string[];
};

function defaultFilters(): DashboardFilterState {
  return {
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    fedes: [],
    competitionTypes: [],
    competitionDepts: [],
    riderDepts: [],
    clubs: [],
  };
}

function toISODate(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toChartFilters(state: DashboardFilterState): DashboardChartFilters {
  return {
    startDate: toISODate(state.startDate),
    endDate: toISODate(state.endDate),
    fedes: state.fedes,
    competitionTypes: state.competitionTypes,
    competitionDepts: state.competitionDepts,
    riderDepts: state.riderDepts,
    clubs: state.clubs,
  };
}

export function useDashboardFilters() {
  const [filters, setFilters] = useState<DashboardFilterState>(defaultFilters);

  const updateFilter = <K extends keyof DashboardFilterState>(
    key: K,
    value: DashboardFilterState[K],
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters());

  return { filters, updateFilter, resetFilters, chartFilters: toChartFilters(filters) };
}
