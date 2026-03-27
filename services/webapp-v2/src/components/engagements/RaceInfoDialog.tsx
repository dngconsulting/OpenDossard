import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateCompetition } from '@/hooks/useCompetitions';
import type { CompetitionDetailType } from '@/types/competitions';

interface RaceInfoDialogProps {
  competition: CompetitionDetailType;
  showAboyeur: boolean;
}

export function RaceInfoDialog({ competition, showAboyeur }: RaceInfoDialogProps) {
  const [open, setOpen] = useState(false);
  const [commissaires, setCommissaires] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [aboyeur, setAboyeur] = useState('');
  const [feedback, setFeedback] = useState('');

  const updateCompetition = useUpdateCompetition();

  useEffect(() => {
    if (open) {
      setCommissaires(competition.commissaires ?? '');
      setSpeaker(competition.speaker ?? '');
      setAboyeur(competition.aboyeur ?? '');
      setFeedback(competition.feedback ?? '');
    }
  }, [open, competition]);

  const handleSave = () => {
    updateCompetition.mutate(
      {
        id: competition.id,
        data: { commissaires, speaker, aboyeur, feedback },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        title="Information épreuve"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Information épreuve</DialogTitle>
            <DialogDescription>
              Commissaires, speaker et notes pour cette épreuve.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="commissaires">Commissaires</Label>
              <Input
                id="commissaires"
                value={commissaires}
                onChange={e => setCommissaires(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="speaker">Speaker</Label>
              <Input
                id="speaker"
                value={speaker}
                onChange={e => setSpeaker(e.target.value)}
              />
            </div>

            {showAboyeur && (
              <div className="grid gap-2">
                <Label htmlFor="aboyeur">Aboyeur</Label>
                <Input
                  id="aboyeur"
                  value={aboyeur}
                  onChange={e => setAboyeur(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="feedback">Note commissaire(s)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateCompetition.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateCompetition.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
