import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CompetitionsDataTable } from '@/components/data/CompetitionsTable';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { useCompetitions, useDeleteCompetition } from '@/hooks/useCompetitions';
import { FEDERATION_VALUES, type CompetitionType } from '@/types/competitions';
import { downloadFromApi } from '@/utils/download';
import { showSuccessToast, showErrorToast } from '@/utils/error-handler/error-handler';

const STORAGE_KEY = 'opendossard:competitions-filters';
const FEDE_OPTIONS = FEDERATION_VALUES.map(f => ({ label: f, value: f }));

export default function CompetitionsPage() {
  const navigate = useNavigate();
  const [duplicateCompetition, setDuplicateCompetition] = useState<CompetitionType | undefined>(undefined);
  const [deleteCompetition, setDeleteCompetition] = useState<CompetitionType | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const { data, setAdvancedFilters, params } = useCompetitions();
  const { mutate: deleteComp, isPending: isDeleting } = useDeleteCompetition();
  const totalCompetitions = data?.meta?.total ?? 0;

  const today = format(new Date(), 'yyyy-MM-dd');
  const selectedFedes = params.fedes ? params.fedes.split(',') : [];

  // Restaurer les filtres au montage
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) {return;}
    initialized.current = true;
    if (searchParams.has('startDate') || searchParams.has('endDate') || searchParams.has('fedes')) {return;}

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAdvancedFilters({
          startDate: parsed.startDate || undefined,
          endDate: parsed.endDate || undefined,
          fedes: parsed.fedes || undefined,
          orderDirection: parsed.orderDirection || 'DESC',
        });
        return;
      } catch { /* fallback ci-dessous */ }
    }
    setAdvancedFilters({ startDate: today, orderDirection: 'ASC' });
  }, [searchParams, setAdvancedFilters, today]);

  // Sauvegarder dans localStorage après initialisation
  useEffect(() => {
    if (!initialized.current) {return;}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      startDate: params.startDate,
      endDate: params.endDate,
      fedes: params.fedes,
      orderDirection: params.orderDirection,
    }));
  }, [params.startDate, params.endDate, params.fedes, params.orderDirection]);

  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;

  const datePresets = [
    { id: 'all', label: 'Toutes', checked: !params.startDate && !params.endDate, startDate: undefined, endDate: undefined, order: 'DESC' },
    { id: 'future', label: 'Futures', checked: params.startDate === today && !params.endDate, startDate: today, endDate: undefined, order: 'ASC' },
    { id: 'past', label: 'Passées', checked: params.endDate === today && !params.startDate, startDate: undefined, endDate: today, order: 'DESC' },
  ] as const;

  const applyDateFilters = ({ startDate: start, endDate: end, orderDirection: order }: { startDate?: string; endDate?: string; orderDirection: 'ASC' | 'DESC' }) => {
    setAdvancedFilters({ startDate: start, endDate: end, fedes: params.fedes, orderDirection: order });
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
    if (!deleteCompetition) {return;}
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

  const toolbarLeft = (
    <span className="text-sm text-muted-foreground">
      Nombre d'épreuves : <strong className="text-foreground">{totalCompetitions}</strong>
    </span>
  );

  const toolbar = (
    <Button variant="success" onClick={() => navigate('/competition/new')}>
      <Plus /> Créer une épreuve
    </Button>
  );

  return (
    <Layout title="Épreuves" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Date de début :</span>
          <DatePicker
            value={startDate}
            onChange={date => applyDateFilters({
              startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
              orderDirection: date ? 'ASC' : 'DESC',
            })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Date de fin :</span>
          <DatePicker
            value={endDate}
            onChange={date => applyDateFilters({
              endDate: date ? format(date, 'yyyy-MM-dd') : undefined,
              orderDirection: 'DESC',
            })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Fédé :</span>
          <MultiSelect
            options={FEDE_OPTIONS}
            selected={selectedFedes}
            onChange={values => setAdvancedFilters({ fedes: values.length > 0 ? values.join(',') : undefined })}
            placeholder="Toutes"
            className="h-9 min-w-[140px]"
          />
        </div>
        <div className="flex items-center gap-4">
          {datePresets.map(preset => (
            <div key={preset.id} className="flex items-center gap-1.5">
              <Checkbox
                className="border-2"
                id={`display-${preset.id}`}
                checked={preset.checked}
                onCheckedChange={() => applyDateFilters({
                  startDate: preset.startDate,
                  endDate: preset.endDate,
                  orderDirection: preset.order,
                })}
              />
              <label htmlFor={`display-${preset.id}`} className="text-sm font-medium text-foreground whitespace-nowrap cursor-pointer">
                {preset.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <CompetitionsDataTable
        getEditHref={(row: CompetitionType) => `/competition/${row.id}`}
        onDuplicate={(row: CompetitionType) => setDuplicateCompetition(row)}
        onDelete={handleDeleteRequest}
        onExportFiche={handleExportFiche}
      />

      <ConfirmDialog
        open={!!duplicateCompetition}
        onOpenChange={open => !open && setDuplicateCompetition(undefined)}
        title="Dupliquer une épreuve"
        description={`Voulez-vous dupliquer l'épreuve "${duplicateCompetition?.name}" ?`}
        confirmLabel="Dupliquer"
        onConfirm={() => {
          if (!duplicateCompetition) {return;}
          setDuplicateCompetition(undefined);
          navigate(`/competition/new?duplicateFrom=${duplicateCompetition.id}`);
        }}
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
