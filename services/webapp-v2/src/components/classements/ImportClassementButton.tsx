import { FileUp, Upload } from 'lucide-react';
import { createElement, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { AppToast } from '@/components/ui/app-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUploadResultsCsv } from '@/hooks/useRaces';

type ImportClassementButtonProps = {
  competitionId: number;
};

export function ImportClassementButton({ competitionId }: ImportClassementButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadResultsCsv();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = () => {
    if (!file) return;

    uploadMutation.mutate(
      { competitionId, file },
      {
        onSuccess: (data) => {
          const hasErrors = data.errors.length > 0;
          const details = hasErrors ? data.errors.join('\n') : undefined;
          toast.custom((id) =>
            createElement(AppToast, {
              id,
              type: hasErrors ? 'warning' : 'success',
              message: `${data.processed} lignes traitées${hasErrors ? `, ${data.errors.length} erreur(s)` : ''}`,
              details,
            }),
          );
          setOpen(false);
          setFile(null);
        },
        onError: (error) => {
          toast.custom((id) =>
            createElement(AppToast, {
              id,
              type: 'error',
              message: "Erreur lors de l'import",
              details: error.message,
            }),
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFile(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Importer classement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer un classement CSV</DialogTitle>
          <DialogDescription>
            Format attendu : fichier CSV avec séparateur <code>;</code> et colonnes{' '}
            <strong>Dossard;Chrono;Tours;Classement</strong>.
            <br />
            Le classement peut être un nombre ou un code (ABD, DSQ, NC, NP, CHT).
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-foreground cursor-pointer"
        >
          <FileUp className="h-8 w-8" />
          {file ? (
            <span className="text-sm font-medium text-foreground">{file.name}</span>
          ) : (
            <span className="text-sm">Cliquez pour sélectionner un fichier CSV</span>
          )}
        </button>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Import en cours...' : 'Importer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
