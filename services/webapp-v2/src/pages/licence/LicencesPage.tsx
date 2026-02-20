import { FileSpreadsheet, FileText, Loader2, MoreHorizontal, Plus, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LicencesDataTable } from '@/components/data/LicencesTable.tsx';
import { useExportLicencesCSV } from '@/hooks/useExportLicencesCSV';
import { useExportLicencesPDF } from '@/hooks/useExportLicencesPDF';
import { useImportElicence, useLicences } from '@/hooks/useLicences';
import { ImportResultDialog } from '@/components/licences/ImportResultDialog';
import type { ImportResult } from '@/api/licences.api';
import Layout from '@/components/layout/Layout.tsx';
import { Button } from '@/components/ui/button.tsx';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LicenceType } from '@/types/licences.ts';

export default function LicencesPage() {
  const navigate = useNavigate();
  const [deleteLicence, setDeleteLicence] = useState<LicenceType | undefined>(undefined);
  const { data, params } = useLicences();
  const totalLicences = data?.meta?.total ?? 0;
  const { exportPDF, isExporting: isExportingPDF } = useExportLicencesPDF(params, totalLicences);
  const { exportCSV, isExporting: isExportingCSV } = useExportLicencesCSV(params, totalLicences);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportElicence();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importMutation.mutateAsync(file);
      setImportResult(result);
    } catch {
      // error handled by mutation/error-handler
    }
    e.target.value = '';
  };

  const DeleteLicence = () => (
    <Dialog
      open={!!deleteLicence}
      onOpenChange={(open: boolean) => !open && setDeleteLicence(undefined)}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Suppression de licence</DialogTitle>
          <DialogDescription>
            Voulez-vous supprimer la licence {deleteLicence?.licenceNumber} de manière définitive ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteLicence(undefined)}>Annuler</Button>
          <Button variant="destructive">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const toolbarLeft = (
    <span className="text-sm text-muted-foreground">
      Nombre de licences : <strong className="text-foreground">{totalLicences}</strong>
    </span>
  );

  const toolbar = (
    <>
      <Button variant="success" onClick={() => navigate('/licence/new')}>
        <Plus /> Ajouter une licence
      </Button>
      <DeleteLicence />
      {/* Desktop: boutons visibles */}
      <Button
        variant="action"
        className="hidden md:flex"
        onClick={exportPDF}
        disabled={isExportingPDF}
      >
        {isExportingPDF ? <Loader2 className="animate-spin" /> : <FileText />}
        Export PDF
      </Button>
      <Button
        variant="action"
        className="hidden md:flex"
        onClick={exportCSV}
        disabled={isExportingCSV}
      >
        {isExportingCSV ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
        Export CSV
      </Button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="action"
              className="hidden md:flex"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
              Import e-licence
            </Button>
          </TooltipTrigger>
          <TooltipContent>Importer un fichier fourni par Exalto E-licences</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Mobile: menu déroulant */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="md:hidden">
          <Button variant="action" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportPDF} disabled={isExportingPDF}>
            {isExportingPDF ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportCSV} disabled={isExportingCSV}>
            {isExportingCSV ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import e-licence
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <Layout title="Licences" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <LicencesDataTable
        getEditHref={(row: LicenceType) => `/licence/${row.id}`}
        onDelete={(row: LicenceType) => setDeleteLicence(row)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportFile}
      />
      <ImportResultDialog
        result={importResult}
        onClose={() => setImportResult(null)}
      />
    </Layout>
  );
}
