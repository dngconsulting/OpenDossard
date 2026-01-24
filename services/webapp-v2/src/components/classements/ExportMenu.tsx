import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RaceRowType } from '@/types/races';
import {
  transformRows,
  exportClassementsCsv,
  exportAllClassementsCsv,
} from '@/utils/classements';

type ExportMenuProps = {
  engagements: RaceRowType[];
  currentRaceCode: string;
  races: string[];
  competitionName: string;
  avecChrono: boolean;
};

export function ExportMenu({
  engagements,
  currentRaceCode,
  races,
  competitionName,
  avecChrono,
}: ExportMenuProps) {
  const handleExportCurrentRace = () => {
    const rows = transformRows(engagements, currentRaceCode);
    exportClassementsCsv(rows, competitionName, currentRaceCode, avecChrono);
  };

  const handleExportAllRaces = () => {
    exportAllClassementsCsv(engagements, races, competitionName, avecChrono);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Télécharger
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCurrentRace}>
          CSV course {currentRaceCode}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportAllRaces}>
          CSV toutes les courses
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
