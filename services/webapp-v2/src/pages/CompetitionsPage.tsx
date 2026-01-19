import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CompetitionsDataTable } from '@/components/data/CompetitionsTable';
import { useCompetitions, useDuplicateCompetition } from '@/hooks/useCompetitions';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
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
  const { data } = useCompetitions();
  const { mutate: duplicate, isPending: isDuplicating } = useDuplicateCompetition();
  const totalCompetitions = data?.meta?.total ?? 0;

  const handleDuplicate = () => {
    if (!duplicateCompetition) return;

    duplicate(duplicateCompetition.id, {
      onSuccess: (newCompetition) => {
        toast.success(`Épreuve "${duplicateCompetition.name}" dupliquée avec succès`);
        setDuplicateCompetition(undefined);
        navigate(`/competition/${newCompetition.id}`);
      },
      onError: () => {
        toast.error(`Erreur lors de la duplication de l'épreuve`);
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
      <CompetitionsDataTable
        onEdit={(row: CompetitionType) => navigate(`/competition/${row.id}`)}
        onDuplicate={(row: CompetitionType) => setDuplicateCompetition(row)}
      />
    </Layout>
  );
}
