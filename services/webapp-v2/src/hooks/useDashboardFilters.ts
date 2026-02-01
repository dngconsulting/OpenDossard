import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subYears, parseISO } from 'date-fns';
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

const ARRAY_KEYS = ['fedes', 'competitionTypes', 'competitionDepts', 'riderDepts', 'clubs'] as const;

function defaultStartDate(): Date {
  return subYears(new Date(), 1);
}

function defaultEndDate(): Date {
  return new Date();
}

function toISODate(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(value: string | null, fallback: () => Date): Date | undefined {
  if (value === '') return undefined;
  if (!value) return fallback();
  try {
    const d = parseISO(value);
    return isNaN(d.getTime()) ? fallback() : d;
  } catch {
    return fallback();
  }
}

function parseArray(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

function filtersFromParams(params: URLSearchParams): DashboardFilterState {
  return {
    startDate: parseDate(params.get('startDate'), defaultStartDate),
    endDate: parseDate(params.get('endDate'), defaultEndDate),
    fedes: parseArray(params.get('fedes')),
    competitionTypes: params.has('competitionTypes') ? parseArray(params.get('competitionTypes')) : ['ROUTE'],
    competitionDepts: parseArray(params.get('competitionDepts')),
    riderDepts: parseArray(params.get('riderDepts')),
    clubs: parseArray(params.get('clubs')),
  };
}

function filtersToParams(state: DashboardFilterState): URLSearchParams {
  const params = new URLSearchParams();
  const defaultStart = toISODate(defaultStartDate());
  const defaultEnd = toISODate(defaultEndDate());

  const startStr = toISODate(state.startDate);
  const endStr = toISODate(state.endDate);

  if (startStr === undefined) params.set('startDate', '');
  else if (startStr !== defaultStart) params.set('startDate', startStr);

  if (endStr === undefined) params.set('endDate', '');
  else if (endStr !== defaultEnd) params.set('endDate', endStr);

  for (const key of ARRAY_KEYS) {
    const val = state[key];
    if (key === 'competitionTypes') {
      // Don't persist the default value ['ROUTE'], but persist empty (user cleared) or other selections
      const isDefault = val.length === 1 && val[0] === 'ROUTE';
      if (!isDefault) params.set(key, val.join(','));
    } else if (val.length > 0) {
      params.set(key, val.join(','));
    }
  }

  return params;
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
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const updateFilter = useCallback(<K extends keyof DashboardFilterState>(
    key: K,
    value: DashboardFilterState[K],
  ) => {
    setSearchParams(prev => {
      const current = filtersFromParams(prev);
      return filtersToParams({ ...current, [key]: value });
    }, { replace: true });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, updateFilter, resetFilters, chartFilters: toChartFilters(filters) };
}
