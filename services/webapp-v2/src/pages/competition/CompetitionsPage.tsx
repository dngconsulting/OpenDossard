import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useUserStore from '@/store/UserStore';
import { showSuccessToast, showErrorToast } from '@/utils/error-handler/error-handler';
import { CompetitionsDataTable } from '@/components/data/CompetitionsTable';
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
    setDuplicateCompetition(undefined);
    navigate(`/competition/new?duplicateFrom=${duplicateCompetition.id}`);
  };

  const handleExportFiche = async (comp: CompetitionType) => {
    try {
      const token = useUserStore.getState().getAccessToken();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v2';
      const response = await fetch(
        `${baseUrl}/pdf-reports/fiche-epreuve/${comp.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fiche_epreuve_${comp.name.replace(/\s/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
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
