import { RotateCcw } from 'lucide-react';

import Layout from '@/components/layout/Layout.tsx';
import { Button } from '@/components/ui/button';
import { ClubAutocomplete } from '@/components/ui/club-autocomplete';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { CateaDistributionChart } from '@/components/charts/CateaDistributionChart';
import { CatevDistributionChart } from '@/components/charts/CatevDistributionChart';
import { ClubParticipationChart } from '@/components/charts/ClubParticipationChart';
import { RidersPerCompetitionChart } from '@/components/charts/RidersPerCompetitionChart';
import { TopRidersChart } from '@/components/charts/TopRidersChart';
import { useClubs } from '@/hooks/useClubs';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import {
  useRidersPerCompetition,
  useClubParticipation,
  useCateaDistribution,
  useCatevDistribution,
  useTopRiders,
} from '@/hooks/useDashboardCharts';
import { useDepartments } from '@/hooks/useDepartments';

const FEDE_OPTIONS: MultiSelectOption[] = [
  { value: 'FSGT', label: 'FSGT' },
  { value: 'UFOLEP', label: 'UFOLEP' },
  { value: 'FFC', label: 'FFC' },
  { value: 'CYCLOS', label: 'CYCLOS' },
  { value: 'FFVELO', label: 'FFVELO' },
  { value: 'FFTRI', label: 'FFTRI' },
];

const DISCIPLINE_OPTIONS: MultiSelectOption[] = [
  { value: 'CX', label: 'CX' },
  { value: 'ROUTE', label: 'Route' },
  { value: 'VTT', label: 'VTT' },
];

export default function DashboardPage() {
  const { filters, updateFilter, resetFilters, chartFilters } = useDashboardFilters();
  const { data: departments } = useDepartments();
  const { data: allClubs } = useClubs();

  const deptOptions: MultiSelectOption[] = (departments || []).map(d => ({
    value: d.code,
    label: `${d.code} - ${d.name}`,
  }));

  const ridersPerComp = useRidersPerCompetition(chartFilters);
  const clubPart = useClubParticipation(chartFilters);
  const cateaDist = useCateaDistribution(chartFilters);
  const catevDist = useCatevDistribution(chartFilters);
  const topRiders = useTopRiders(chartFilters);

  const toolbar = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <DatePicker
        value={filters.startDate}
        onChange={d => updateFilter('startDate', d)}
        placeholder="Date début"
      />
      <DatePicker
        value={filters.endDate}
        onChange={d => updateFilter('endDate', d)}
        placeholder="Date fin"
      />
      <MultiSelect
        options={FEDE_OPTIONS}
        selected={filters.fedes}
        onChange={v => updateFilter('fedes', v)}
        placeholder="Toutes fédés"
      />
      <MultiSelect
        options={DISCIPLINE_OPTIONS}
        selected={filters.competitionTypes}
        onChange={v => updateFilter('competitionTypes', v)}
        placeholder="Toutes disciplines"
      />
      <MultiSelect
        options={deptOptions}
        selected={filters.competitionDepts}
        onChange={v => updateFilter('competitionDepts', v)}
        placeholder="Région épreuves"
      />
      <MultiSelect
        options={deptOptions}
        selected={filters.riderDepts}
        onChange={v => updateFilter('riderDepts', v)}
        placeholder="Région coureurs"
      />
      <ClubAutocomplete
        clubs={allClubs || []}
        selected={filters.clubs}
        onChange={v => updateFilter('clubs', v)}
      />
      <Button variant="ghost" size="sm" onClick={resetFilters}>
        <RotateCcw className="h-4 w-4 mr-1" />
        Réinitialiser
      </Button>
    </div>
  );

  return (
    <Layout title="Tableau de bord" toolbar={toolbar}>
      <div className="space-y-8">
        <RidersPerCompetitionChart data={ridersPerComp.data} isLoading={ridersPerComp.isLoading} defaultOpen={false} />

        <ClubParticipationChart data={clubPart.data} isLoading={clubPart.isLoading} defaultOpen={false} />

        <div className="grid gap-8 md:grid-cols-2">
          <CateaDistributionChart data={cateaDist.data} isLoading={cateaDist.isLoading} />
          <CatevDistributionChart data={catevDist.data} isLoading={catevDist.isLoading} />
        </div>

        <TopRidersChart data={topRiders.data} isLoading={topRiders.isLoading} defaultOpen={false} />
      </div>
    </Layout>
  );
}
