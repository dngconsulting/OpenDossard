import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { LicenceAutocomplete } from '@/components/LicenceAutocomplete';
import { PalmaresResultsTable } from '@/components/palmares/PalmaresResultsTable';
import { RankingHistorySection } from '@/components/palmares/RankingHistorySection';
import { RiderHeaderCard } from '@/components/palmares/RiderHeaderCard';
import { RiderStatsCards } from '@/components/palmares/RiderStatsCards';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePalmares } from '@/hooks/usePalmares';
import type { LicenceType } from '@/types/licences';

export default function PalmaresPage() {
  const { licenceId } = useParams<{ licenceId: string }>();
  const navigate = useNavigate();
  const parsedId = licenceId ? parseInt(licenceId, 10) : undefined;
  const { data: palmares, isLoading } = usePalmares(parsedId);

  const [selectedLicence, setSelectedLicence] = useState<LicenceType | null>(null);

  // Sync selected licence on direct URL access
  useEffect(() => {
    if (palmares?.licence && !selectedLicence) {
      setSelectedLicence(palmares.licence);
    }
  }, [palmares?.licence?.id]);

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
        <div className="flex items-center gap-4">
          <Label className="shrink-0 text-sm font-medium">Coureur</Label>
          <div className="flex-1">
            <LicenceAutocomplete
              value={selectedLicence}
              onChange={handleLicenceChange}
              hideLabel
            />
          </div>
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

        {palmares && (
          <>
            <RiderHeaderCard licence={palmares.licence} />
            <RiderStatsCards stats={palmares.stats} />
            <RankingHistorySection history={palmares.categoryHistory} />
            <PalmaresResultsTable results={palmares.results} />
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
