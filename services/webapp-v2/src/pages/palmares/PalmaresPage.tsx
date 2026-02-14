import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { LicenceAutocomplete } from '@/components/LicenceAutocomplete';
import { PalmaresResultsTable } from '@/components/palmares/PalmaresResultsTable';
import { RankingHistorySection } from '@/components/palmares/RankingHistorySection';
import { RiderHeaderCard } from '@/components/palmares/RiderHeaderCard';
import { RiderStatsCards } from '@/components/palmares/RiderStatsCards';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePalmares } from '@/hooks/usePalmares';
import type { LicenceType } from '@/types/licences';
import type { PalmaresRaceResult, RiderStats } from '@/types/palmares';

const ALL_SEASONS = '__all__';

function computeStats(results: PalmaresRaceResult[]): RiderStats {
  const ranked = results
    .filter(r => r.rankingScratch != null && r.rankingInCategory != null)
    .map(r => ({ ...r, rankingInCategory: Number(r.rankingInCategory) }));
  return {
    totalRaces: results.length,
    wins: ranked.filter(r => r.rankingInCategory === 1).length,
    podiums: ranked.filter(r => r.rankingInCategory <= 3).length,
    topTen: ranked.filter(r => r.rankingInCategory <= 10).length,
    bestRanking: ranked.length > 0 ? Math.min(...ranked.map(r => r.rankingInCategory)) : 0,
  };
}

export default function PalmaresPage() {
  const { licenceId } = useParams<{ licenceId: string }>();
  const navigate = useNavigate();
  const parsedId = licenceId ? parseInt(licenceId, 10) : undefined;
  const { data: palmares, isLoading } = usePalmares(parsedId);

  const [selectedLicence, setSelectedLicence] = useState<LicenceType | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>(ALL_SEASONS);

  // Sync selected licence on direct URL access
  useEffect(() => {
    if (palmares?.licence && !selectedLicence) {
      setSelectedLicence(palmares.licence);
    }
  }, [palmares?.licence?.id]);

  // Reset season filter when rider changes
  useEffect(() => {
    setSelectedSeason(ALL_SEASONS);
  }, [parsedId]);

  const seasons = useMemo(() => {
    if (!palmares?.results) return [];
    const years = new Set(palmares.results.map(r => new Date(r.date).getFullYear().toString()));
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [palmares?.results]);

  const filteredResults = useMemo(() => {
    if (!palmares?.results) return [];
    if (selectedSeason === ALL_SEASONS) return palmares.results;
    return palmares.results.filter(r => new Date(r.date).getFullYear().toString() === selectedSeason);
  }, [palmares?.results, selectedSeason]);

  const filteredStats = useMemo(() => {
    if (!palmares) return null;
    if (selectedSeason === ALL_SEASONS) return palmares.stats;
    return computeStats(filteredResults);
  }, [palmares, selectedSeason, filteredResults]);

  const filteredHistoryRoute = useMemo(() => {
    if (!palmares) return [];
    if (selectedSeason === ALL_SEASONS) return palmares.categoryHistoryRoute;
    return palmares.categoryHistoryRoute.filter(h => h.season === selectedSeason);
  }, [palmares, selectedSeason]);

  const filteredHistoryCX = useMemo(() => {
    if (!palmares) return [];
    if (selectedSeason === ALL_SEASONS) return palmares.categoryHistoryCX;
    return palmares.categoryHistoryCX.filter(h => h.season === selectedSeason);
  }, [palmares, selectedSeason]);

  const handleLicenceChange = (licence: LicenceType | null) => {
    setSelectedLicence(licence);
    if (licence) {
      navigate(`/palmares/${licence.id}`);
    } else {
      navigate('/palmares');
    }
  };

  return (
    <Layout title="Palmarès">
      <div className="space-y-5">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
          <Label className="text-sm font-medium">Coureur</Label>
          <LicenceAutocomplete
            value={selectedLicence}
            onChange={handleLicenceChange}
            hideLabel
          />
          {palmares && seasons.length > 0 && (
            <>
              <Label className="text-sm font-medium">Saison</Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value={ALL_SEASONS}>Toutes</SelectItem>
                {seasons.map(season => (
                  <SelectItem key={season} value={season}>{season}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </>
          )}
        </div>
        {isLoading && parsedId && (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {palmares && filteredStats && (
          <>
            <RiderHeaderCard licence={palmares.licence} />
            <RiderStatsCards stats={filteredStats} />
            <RankingHistorySection historyRoute={filteredHistoryRoute} historyCX={filteredHistoryCX} />
            <PalmaresResultsTable results={filteredResults} />
          </>
        )}

        {!parsedId && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-7 w-7" />
            </div>
            <p className="text-lg font-medium">Recherchez un coureur</p>
            <p className="text-sm mt-1">pour afficher son palmarès</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
