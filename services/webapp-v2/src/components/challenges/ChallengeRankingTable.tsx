import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Medal, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Trophy className="size-12 mx-auto mb-4 opacity-20" />
          <p>Aucun classement disponible pour cette catégorie.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-t-none border-t-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-12 text-center">Clt.</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Club</TableHead>
              <TableHead className="text-center">Catégorie</TableHead>
              <TableHead className="text-center">Courses</TableHead>
              <TableHead className="text-right">Points</TableHead>
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
                    <TableCell className="w-10 px-2">
                      <button className="p-1 hover:bg-muted rounded">
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <div className="flex items-center justify-center gap-1">
                        {rankIcon}
                        <span>{rank}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {rider.name?.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {rider.firstName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rider.currentClub || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {rider.currentLicenceCatev}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {nbRaces}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {rider.ptsAllRaces || 0}
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={8} className="p-0">
                        <div className="px-4 py-3 border-l-4 border-primary/50">
                          <div className="font-semibold text-sm mb-2">
                            {rider.firstName} {rider.name?.toUpperCase()}
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="text-xs bg-muted/30">
                                <TableHead className="h-8 py-1">Course</TableHead>
                                <TableHead className="h-8 py-1 w-28">Date</TableHead>
                                <TableHead className="h-8 py-1 w-24 text-center">Catégorie</TableHead>
                                <TableHead className="h-8 py-1 w-24 text-center">Classement</TableHead>
                                <TableHead className="h-8 py-1 w-32 text-center">Points épreuve</TableHead>
                                <TableHead className="h-8 py-1 text-center">Explications</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rider.challengeRaceRows?.map((race, idx) => (
                                <TableRow key={idx} className="text-sm">
                                  <TableCell className="py-1.5">
                                    {race.competitionName || '-'}
                                  </TableCell>
                                  <TableCell className="py-1.5">
                                    {formatDate(race.eventDate)}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-center">
                                    {race.catev}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-center">
                                    {race.comment ? (
                                      <span className="text-muted-foreground italic">{race.comment}</span>
                                    ) : (
                                      race.rankingScratch || '-'
                                    )}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-center font-medium">
                                    {race.ptsRace || 0}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-muted-foreground text-xs text-center">
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
      </CardContent>
    </Card>
  );
}
