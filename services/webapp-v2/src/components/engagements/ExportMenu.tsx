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
  exportEngagesPDF,
  exportAllEngagesPDF,
  exportEmargementPDF,
  exportAllEmargementPDF,
  exportEngagesCsv,
  exportAllEngagesCsv,
} from '@/utils/engagements-exports';

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

  // PDF exports
  const handleExportEngagesPdf = () => {
    exportEngagesPDF(engagements, currentRaceCode, competition);
  };

  const handleExportAllEngagesPdf = () => {
    exportAllEngagesPDF(engagements, races, competition);
  };

  const handleExportEmargementPdf = () => {
    exportEmargementPDF(engagements, currentRaceCode, competition);
  };

  const handleExportAllEmargementPdf = () => {
    exportAllEmargementPDF(engagements, races, competition);
  };

  // CSV exports
  const handleExportEngagesCsv = () => {
    exportEngagesCsv(engagements, currentRaceCode, competition.name);
  };

  const handleExportAllEngagesCsv = () => {
    exportAllEngagesCsv(engagements, races, competition.name);
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
            <DropdownMenuItem onClick={handleExportEngagesPdf}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Engagés {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAllEngagesPdf}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Engagés (toutes courses)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportEmargementPdf}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Émargement {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAllEmargementPdf}>
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Émargement (toutes courses)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-green-600">CSV</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleExportEngagesCsv}>
              <Sheet className="h-4 w-4 mr-2 text-green-600" />
              Engagés {currentRaceCode}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAllEngagesCsv}>
              <Sheet className="h-4 w-4 mr-2 text-green-600" />
              Engagés (toutes courses)
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
                <DropdownMenuItem onClick={handleExportEngagesPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Liste engagés {currentRaceCode}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAllEngagesPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Liste engagés (toutes courses)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportEmargementPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Feuille émargement {currentRaceCode}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAllEmargementPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Feuilles émargement (toutes courses)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sheet className="h-4 w-4 mr-2 text-green-600" />
                CSV
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleExportEngagesCsv}>
                  <Sheet className="h-4 w-4 mr-2" />
                  Engagés {currentRaceCode}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAllEngagesCsv}>
                  <Sheet className="h-4 w-4 mr-2" />
                  Engagés (toutes courses)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
