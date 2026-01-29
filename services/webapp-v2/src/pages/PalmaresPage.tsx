import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { LicenceAutocomplete } from '@/components/LicenceAutocomplete';
import { PalmaresResultsTable } from '@/components/palmares/PalmaresResultsTable';
import { RankingHistorySection } from '@/components/palmares/RankingHistorySection';
import { RiderHeaderCard } from '@/components/palmares/RiderHeaderCard';
import { RiderStatsCards } from '@/components/palmares/RiderStatsCards';
import { Skeleton } from '@/components/ui/skeleton';
import { usePalmares } from '@/hooks/usePalmares';
import type { LicenceType } from '@/types/licences';

export default function PalmaresPage() {
  const { licenceId } = useParams<{ licenceId: string }>();
  const navigate = useNavigate();
  const parsedId = licenceId ? parseInt(licenceId, 10) : undefined;
  const { data: palmares, isLoading } = usePalmares(parsedId);

  const [selectedLicence, setSelectedLicence] = useState<LicenceType | null>(null);

  const handleLicenceChange = (licence: LicenceType | null) => {
    setSelectedLicence(licence);
    if (licence) {
      navigate(`/palmares/${licence.id}`);
    } else {
      navigate('/palmares');
    }
  };

  // Sync selected licence when palmares loads
  if (palmares?.licence && !selectedLicence) {
    setSelectedLicence(palmares.licence);
  }

  return (
    <Layout title="Palmarès">
      <div className="space-y-6">
        <LicenceAutocomplete
          value={selectedLicence}
          onChange={handleLicenceChange}
        />

        {isLoading && parsedId && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
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
          <div className="text-center py-12 text-muted-foreground">
            Recherchez un coureur pour afficher son palmarès
          </div>
        )}
      </div>
    </Layout>
  );
}
