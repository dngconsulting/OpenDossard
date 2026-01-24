import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { RaceRowType } from '@/types/races';
import type { CompetitionDetailType } from '@/types/competitions';
import {
  transformRows,
  exportClassementsCsv,
  exportAllClassementsCsv,
} from '@/utils/classements';
import {
  exportClassementsPDF,
  exportPodiumsPDF,
  exportEngagesPDF,
  exportEmargementPDF,
} from '@/utils/pdf-exports';

type ExportMenuProps = {
  engagements: RaceRowType[];
  currentRaceCode: string;
  races: string[];
  competition: CompetitionDetailType;
};

export function ExportMenu({
  engagements,
  currentRaceCode,
  races,
  competition,
}: ExportMenuProps) {
  // CSV exports
  const handleExportCurrentRaceCsv = () => {
    const rows = transformRows(engagements, currentRaceCode);
    exportClassementsCsv(rows, competition.name, currentRaceCode, competition.avecChrono ?? false);
  };

  const handleExportAllRacesCsv = () => {
    exportAllClassementsCsv(engagements, races, competition.name, competition.avecChrono ?? false);
  };

  // PDF exports
  const handleExportClassementsPdf = () => {
    exportClassementsPDF(engagements, [currentRaceCode], competition);
  };

  const handleExportAllClassementsPdf = () => {
    exportClassementsPDF(engagements, races, competition);
  };

  const handleExportPodiumsPdf = () => {
    exportPodiumsPDF(engagements, competition);
  };

  const handleExportEngagesPdf = () => {
    exportEngagesPDF(engagements, currentRaceCode, competition);
  };

  const handleExportEmargementPdf = () => {
    exportEmargementPDF(engagements, currentRaceCode, competition);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Télécharger
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* PDF Exports */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileText className="h-4 w-4 mr-2 text-red-600" />
            PDF
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Classements
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleExportClassementsPdf}>
              Classements {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAllClassementsPdf}>
              Classements (toutes courses)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPodiumsPdf}>
              Podiums
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Engagés
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleExportEngagesPdf}>
              Liste engagés {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportEmargementPdf}>
              Feuille émargement {currentRaceCode}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* CSV Exports */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
            CSV
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={handleExportCurrentRaceCsv}>
              Classements {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAllRacesCsv}>
              Classements (toutes courses)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
