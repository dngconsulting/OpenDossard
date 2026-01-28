import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { showSuccessToast, showErrorToast } from '@/utils/error-handler/error-handler';
import { CompetitionsDataTable } from '@/components/data/CompetitionsTable';
import { useCompetitions, useDuplicateCompetition } from '@/hooks/useCompetitions';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CompetitionType } from '@/types/competitions';

export default function CompetitionsPage() {
  const navigate = useNavigate();
  const [duplicateCompetition, setDuplicateCompetition] = useState<CompetitionType | undefined>(undefined);
  const { data, setAdvancedFilters, params } = useCompetitions();
  const { mutate: duplicate, isPending: isDuplicating } = useDuplicateCompetition();
  const totalCompetitions = data?.meta?.total ?? 0;

  // Date filters from URL params
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;

  const handleStartDateChange = (date: Date | undefined) => {
    setAdvancedFilters({
      startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setAdvancedFilters({
      endDate: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDuplicate = () => {
    if (!duplicateCompetition) return;

    duplicate(duplicateCompetition.id, {
      onSuccess: (newCompetition) => {
        showSuccessToast(`Épreuve "${duplicateCompetition.name}" dupliquée avec succès`);
        setDuplicateCompetition(undefined);
        navigate(`/competition/${newCompetition.id}`);
      },
      onError: () => {
        showErrorToast(`Erreur lors de la duplication de l'épreuve`);
      },
    });
  };

  const DuplicateDialog = () => (
    <Dialog
      open={!!duplicateCompetition}
      onOpenChange={(open: boolean) => !open && setDuplicateCompetition(undefined)}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dupliquer une épreuve</DialogTitle>
          <DialogDescription>
            Voulez-vous dupliquer l'épreuve "{duplicateCompetition?.name}" ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDuplicateCompetition(undefined)}>
            Annuler
          </Button>
          <Button onClick={handleDuplicate} disabled={isDuplicating}>
            {isDuplicating ? 'Duplication...' : 'Dupliquer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const toolbarLeft = (
    <span className="text-sm text-muted-foreground">
      Nombre d'épreuves : <strong className="text-foreground">{totalCompetitions}</strong>
    </span>
  );

  const toolbar = (
    <>
      <Button variant="success" onClick={() => navigate('/competition/new')}>
        <Plus /> Créer une épreuve
      </Button>
      <DuplicateDialog />
    </>
  );

  return (
    <Layout title="Épreuves" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Date de début :</span>
          <DatePicker
            value={startDate}
            onChange={handleStartDateChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Date de fin :</span>
          <DatePicker
            value={endDate}
            onChange={handleEndDateChange}
          />
        </div>
      </div>

      <CompetitionsDataTable
        onEdit={(row: CompetitionType) => navigate(`/competition/${row.id}`)}
        onDuplicate={(row: CompetitionType) => setDuplicateCompetition(row)}
      />
    </Layout>
  );
}
