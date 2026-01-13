import { Edit2, Info, Plus, CircleStar } from 'lucide-react';
import { useState } from 'react';

import { RacesTable } from '@/components/data/RacesTable.tsx';
import { RaceGeneralForm } from '@/components/forms/RaceForms.tsx';
import { RaceDetailsDialog } from '@/components/races/RaceDetailsDialog';
import Layout from '@/components/layout/Layout.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { FieldSeparator } from '@/components/ui/field.tsx';
import type { RaceType } from '@/types/races.ts';

export default function RacesPage() {
  const [race, setRace] = useState<RaceType>();
  const [deleteRace, setDeleteRace] = useState<RaceType>();
  const [selectedRace, setSelectedRace] = useState<RaceType | undefined>();

  const EditRace = () => (
    <Dialog open={!!race} onOpenChange={(open: boolean) => !open && setRace(undefined)}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setRace({} as RaceType)}>
          <Plus /> Ajouter une épreuve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90%] overflow-y-scroll sm:max-w-[calc(100%-2rem)] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Formulaire épreuve</DialogTitle>
          <DialogDescription>
            Ici, vous pouvez créer / modifier une épreuve OpenDossard
          </DialogDescription>
        </DialogHeader>
        <FieldSeparator />
        <RaceGeneralForm />
      </DialogContent>
    </Dialog>
  );

  const DeleteRace = () => (
    <Dialog open={!!deleteRace} onOpenChange={(open: boolean) => !open && setDeleteRace(undefined)}>
      <DialogContent className="max-h-[90%] overflow-y-scroll sm:max-w-[calc(100%-2rem)] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Suppression d'épreuve</DialogTitle>
          <DialogDescription>
            Voulez-vous supprimer l'épreuve {deleteRace?.id} de manière définitive ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <Layout title="Epreuves">
      <RaceDetailsDialog race={selectedRace} onClose={() => setSelectedRace(undefined)} />
      <div className="flex">
        <Alert variant="default" className="w-full">
          <Info />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription className="flex items-center">
            En cliquant sur le bouton
            <Button variant="outline" size="icon-sm">
              <Edit2 />
            </Button>
            vous pouvez modifier les informations d'une épreuve existante. Afin de visualiser les
            engagements et résultats d'un épreur, cliquez sur le bouton
            <Button variant="outline" size="icon-sm">
              <CircleStar />
            </Button>
            .
          </AlertDescription>
        </Alert>
      </div>
      <div className="flex gap-2 w-full justify-end">
        <EditRace />
        <DeleteRace />
      </div>
      <RacesTable onEditRow={setRace} onDeleteRow={setDeleteRace} onOpenRow={setSelectedRace} />
    </Layout>
  );
}
