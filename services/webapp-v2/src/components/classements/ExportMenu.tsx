import { ChevronDown, Download, FileText, Sheet } from 'lucide-react';

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
import { useIsMobile } from '@/hooks/useMediaQuery';
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
  const isMobile = useIsMobile();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Télécharger
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {isMobile ? (
          <>
            {/* Mobile: flat menu */}
            <DropdownMenuLabel className="text-red-600">PDF</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleExportClassementsPdf}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Classements {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAllClassementsPdf}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Classements (toutes courses)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPodiumsPdf}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Podiums
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-green-600">CSV</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleExportCurrentRaceCsv}>
              <Sheet className="h-4 w-4 mr-2 text-green-600" />
              Classements {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAllRacesCsv}>
              <Sheet className="h-4 w-4 mr-2 text-green-600" />
              Classements (toutes courses)
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {/* Desktop: submenus */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                PDF
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleExportClassementsPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Classements {currentRaceCode}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAllClassementsPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Classements (toutes courses)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPodiumsPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Podiums
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sheet className="h-4 w-4 mr-2 text-green-600" />
                CSV
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleExportCurrentRaceCsv}>
                  <Sheet className="h-4 w-4 mr-2" />
                  Classements {currentRaceCode}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAllRacesCsv}>
                  <Sheet className="h-4 w-4 mr-2" />
                  Classements (toutes courses)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
