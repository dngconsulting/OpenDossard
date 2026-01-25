import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Medal, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ChallengeRider } from '@/types/challenges';

type Props = {
  riders: ChallengeRider[];
  isLoading?: boolean;
};

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="size-5 text-yellow-500" />;
    case 2:
      return <Medal className="size-5 text-gray-400" />;
    case 3:
      return <Medal className="size-5 text-amber-600" />;
    default:
      return null;
  }
}

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ChallengeRankingTable({ riders, isLoading }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (licenceId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(licenceId)) {
        next.delete(licenceId);
      } else {
        next.add(licenceId);
      }
      return next;
    });
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (riders.length === 0) {
    return (
      <div className="border rounded-t-none border-t-0 rounded-b-lg py-12 text-center text-muted-foreground">
        <Trophy className="size-12 mx-auto mb-4 opacity-20" />
        <p>Aucun classement disponible pour cette catégorie.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-t-none border-t-0 rounded-b-lg overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader className="bg-muted/50">
          <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[60px] text-center">Clt.</TableHead>
              <TableHead className="w-[120px]">Nom</TableHead>
              <TableHead className="w-[100px]">Prénom</TableHead>
              <TableHead className="w-[180px]">Club</TableHead>
              <TableHead className="w-[100px] text-center">Catégorie</TableHead>
              <TableHead className="w-[80px] text-center">Courses</TableHead>
              <TableHead className="w-[80px] text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.map((rider, index) => {
              const rank = index + 1;
              const licenceId = rider.licenceId || `rider-${index}`;
              const isExpanded = expandedRows.has(licenceId);
              const nbRaces = rider.challengeRaceRows?.length || 0;
              const rankIcon = getRankIcon(rank);

              return (
                <Fragment key={licenceId}>
                  <TableRow
                    className={`cursor-pointer hover:bg-muted/50 ${rank <= 3 ? 'bg-primary/5' : ''}`}
                    onClick={() => toggleRow(licenceId)}
                  >
                    <TableCell className="w-[40px] px-2">
                      <button className="p-1 hover:bg-muted rounded">
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="w-[60px] text-center font-medium">
                      <div className="flex items-center justify-center gap-1">
                        {rankIcon}
                        <span>{rank}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px] font-medium truncate" title={rider.name?.toUpperCase()}>
                      {rider.name?.toUpperCase()}
                    </TableCell>
                    <TableCell className="w-[100px] truncate" title={rider.firstName}>
                      {rider.firstName}
                    </TableCell>
                    <TableCell className="w-[180px] text-muted-foreground truncate" title={rider.currentClub || '-'}>
                      {rider.currentClub || '-'}
                    </TableCell>
                    <TableCell className="w-[100px] text-center">
                      <Badge variant="outline">
                        {rider.currentLicenceCatev}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[80px] text-center text-muted-foreground">
                      {nbRaces}
                    </TableCell>
                    <TableCell className="w-[80px] text-right font-bold text-lg">
                      {rider.ptsAllRaces || 0}
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={8} className="p-0">
                        <div className="px-4 py-3 border-l-4 border-primary/50 overflow-x-auto">
                          <div className="font-semibold text-sm mb-2">
                            {rider.firstName} {rider.name?.toUpperCase()}
                          </div>
                          <Table className="min-w-[700px]">
                            <TableHeader>
                              <TableRow className="text-xs bg-muted/30">
                                <TableHead className="h-8 py-1 w-[180px]">Course</TableHead>
                                <TableHead className="h-8 py-1 w-[100px]">Date</TableHead>
                                <TableHead className="h-8 py-1 w-[80px] text-center">Catégorie</TableHead>
                                <TableHead className="h-8 py-1 w-[80px] text-center">Clt.</TableHead>
                                <TableHead className="h-8 py-1 w-[80px] text-center">Points</TableHead>
                                <TableHead className="h-8 py-1 w-[180px] text-center">Explications</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rider.challengeRaceRows?.map((race, idx) => (
                                <TableRow key={idx} className="text-sm">
                                  <TableCell className="py-1.5 w-[180px] truncate" title={race.competitionName || '-'}>
                                    {race.competitionName || '-'}
                                  </TableCell>
                                  <TableCell className="py-1.5 w-[100px]">
                                    {formatDate(race.eventDate)}
                                  </TableCell>
                                  <TableCell className="py-1.5 w-[80px] text-center">
                                    {race.catev}
                                  </TableCell>
                                  <TableCell className="py-1.5 w-[80px] text-center">
                                    {race.comment ? (
                                      <span className="text-muted-foreground italic">{race.comment}</span>
                                    ) : (
                                      race.rankingScratch || '-'
                                    )}
                                  </TableCell>
                                  <TableCell className="py-1.5 w-[80px] text-center font-medium">
                                    {race.ptsRace || 0}
                                  </TableCell>
                                  <TableCell className="py-1.5 w-[180px] text-muted-foreground text-xs text-center truncate" title={race.explanation || '-'}>
                                    {race.explanation || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
  );
}
