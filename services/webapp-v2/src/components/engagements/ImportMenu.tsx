import { ChevronDown, FileUp, Loader2, Sheet, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import type { ImportEngagesResult } from '@/api/races.api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useImportEngages } from '@/hooks/useRaces';

import { EngageImportResultDialog } from './EngageImportResultDialog';

type ImportMenuProps = {
  competitionId: number;
};

export function ImportMenu({ competitionId }: ImportMenuProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportEngages();
  const [importResult, setImportResult] = useState<ImportEngagesResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) {return;}
    try {
      const result = await importMutation.mutateAsync({ competitionId, file });
      setImportResult(result);
      setOpen(false);
      setFile(null);
    } catch {
      // global error handler
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {setFile(null);}
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            Importer
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Sheet className="h-4 w-4 mr-2 text-green-600" />
            Engagés
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer les engagés depuis un CSV</DialogTitle>
            <DialogDescription>
              Format attendu pour l&apos;import des engagés.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm text-muted-foreground break-words">
            <p>
              <strong className="text-foreground">Colonnes attendues</strong> (séparateur{' '}
              <code>;</code>, en-tête sur la 1<sup>re</sup> ligne) :
            </p>
            <p className="font-mono text-xs break-all rounded bg-muted px-2 py-1 text-foreground">
              Dossard;Nom;Club;Sexe;Dept;Année;CatéA;CatéV;Licence;Fédé;Course
            </p>
            <p>
              C&apos;est le format produit par l&apos;export <em>Télécharger</em> &rarr;{' '}
              <em>CSV</em> &rarr; <em>Engagés</em>. La colonne <em>Course</em> (ex.{' '}
              <code>1/2</code>, <code>3</code>) est insérée telle quelle.
            </p>
            <p>
              Pour chaque ligne, la licence est recherchée en base&nbsp;; tous les autres champs
              doivent correspondre exactement à la licence enregistrée, sinon la ligne est rejetée
              et listée dans le rapport d&apos;anomalies.
            </p>
          </div>

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
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={!file || importMutation.isPending}>
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Import en cours...
                </>
              ) : (
                'Importer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EngageImportResultDialog result={importResult} onClose={() => setImportResult(null)} />
    </>
  );
}
