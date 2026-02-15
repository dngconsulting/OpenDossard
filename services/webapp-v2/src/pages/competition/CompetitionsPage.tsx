import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { downloadFromApi } from '@/utils/download';
import { showSuccessToast, showErrorToast } from '@/utils/error-handler/error-handler';
import { CompetitionsDataTable } from '@/components/data/CompetitionsTable';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCompetitions, useDeleteCompetition } from '@/hooks/useCompetitions';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import type { CompetitionType } from '@/types/competitions';

export default function CompetitionsPage() {
  const navigate = useNavigate();
  const [duplicateCompetition, setDuplicateCompetition] = useState<CompetitionType | undefined>(undefined);
  const [deleteCompetition, setDeleteCompetition] = useState<CompetitionType | undefined>(undefined);
  const { data, setAdvancedFilters, params } = useCompetitions();
  const { mutate: deleteComp, isPending: isDeleting } = useDeleteCompetition();
  const totalCompetitions = data?.meta?.total ?? 0;

  // Date filters
  const today = format(new Date(), 'yyyy-MM-dd');
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;

  // Checkbox state derived from dates
  const isFuture = params.startDate === today && !params.endDate;
  const isPast = params.endDate === today && !params.startDate;
  const isAll = !params.startDate && !params.endDate;

  const handleStartDateChange = (date: Date | undefined) => {
    setAdvancedFilters({
      startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
      orderDirection: date ? 'ASC' : 'DESC',
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setAdvancedFilters({ endDate: date ? format(date, 'yyyy-MM-dd') : undefined, orderDirection: 'DESC' });
  };

  const handleDisplayAllChange = () => {
    setAdvancedFilters({ startDate: undefined, endDate: undefined, orderDirection: 'DESC' });
  };

  const handleDisplayFutureChange = () => {
    setAdvancedFilters({ startDate: today, endDate: undefined, orderDirection: 'ASC' });
  };

  const handleDisplayPastChange = () => {
    setAdvancedFilters({ startDate: undefined, endDate: today, orderDirection: 'DESC' });
  };

  const handleDuplicate = () => {
    if (!duplicateCompetition) return;
    setDuplicateCompetition(undefined);
    navigate(`/competition/new?duplicateFrom=${duplicateCompetition.id}`);
  };

  const handleExportFiche = async (comp: CompetitionType) => {
    try {
      const filename = `Fiche_epreuve_${comp.name.replace(/\s/g, '_')}.pdf`;
      await downloadFromApi(`/reports/pdf/fiche-epreuve/${comp.id}`, filename);
    } catch (error) {
      showErrorToast(
        'Erreur lors de la génération du PDF',
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const handleDeleteRequest = (competition: CompetitionType) => {
    if (competition.engagementsCount > 0) {
      showErrorToast(`Impossible de supprimer "${competition.name}" : ${competition.engagementsCount} engagé(s) en cours`);
      return;
    }
    setDeleteCompetition(competition);
  };

  const handleDelete = () => {
    if (!deleteCompetition) return;
    deleteComp(deleteCompetition.id, {
      onSuccess: () => {
        showSuccessToast(`Épreuve "${deleteCompetition.name}" supprimée`);
        setDeleteCompetition(undefined);
      },
      onError: () => {
        showErrorToast(`Erreur lors de la suppression de l'épreuve`);
      },
    });
  };

  const duplicateDialog = (
    <ConfirmDialog
      open={!!duplicateCompetition}
      onOpenChange={open => !open && setDuplicateCompetition(undefined)}
      title="Dupliquer une épreuve"
      description={`Voulez-vous dupliquer l'épreuve "${duplicateCompetition?.name}" ?`}
      confirmLabel="Dupliquer"
      onConfirm={handleDuplicate}
    />
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
      {duplicateDialog}
    </>
  );

  return (
    <Layout title="Épreuves" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 flex-wrap">
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Checkbox
              className="border-2"
              id="display-all"
              checked={isAll}
              onCheckedChange={handleDisplayAllChange}
            />
            <label htmlFor="display-all" className="text-sm font-medium text-foreground whitespace-nowrap cursor-pointer">
              Toutes
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              className="border-2"
              id="display-future"
              checked={isFuture}
              onCheckedChange={handleDisplayFutureChange}
            />
            <label htmlFor="display-future" className="text-sm font-medium text-foreground whitespace-nowrap cursor-pointer">
              Futures
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              className="border-2"
              id="display-past"
              checked={isPast}
              onCheckedChange={handleDisplayPastChange}
            />
            <label htmlFor="display-past" className="text-sm font-medium text-foreground whitespace-nowrap cursor-pointer">
              Passées
            </label>
          </div>
        </div>
      </div>

      <CompetitionsDataTable
        onEdit={(row: CompetitionType) => navigate(`/competition/${row.id}`)}
        onDuplicate={(row: CompetitionType) => setDuplicateCompetition(row)}
        onDelete={handleDeleteRequest}
        onExportFiche={handleExportFiche}
      />

      <ConfirmDialog
        open={!!deleteCompetition}
        onOpenChange={open => !open && setDeleteCompetition(undefined)}
        title="Supprimer une épreuve"
        description={`Êtes-vous sûr de vouloir supprimer l'épreuve "${deleteCompetition?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </Layout>
  );
}
