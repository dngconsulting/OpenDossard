import { Trophy } from 'lucide-react';
import { useMemo } from 'react';

import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/hooks/useChallenges';
import type { ChallengeType } from '@/types/challenges';

function ChallengeCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-6 w-48 mt-2" />
      </CardHeader>
      <CardContent className="pb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-1" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

type ChallengeSectionProps = { title: string; challenges: ChallengeType[]; emptyLabel?: string };

function ChallengeSection({ title, challenges, emptyLabel }: ChallengeSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold">{title}</h3>
      {challenges.length === 0 && emptyLabel && (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </section>
  );
}

export default function ChallengesPage() {
  const { data: challenges, isLoading, error } = useChallenges(true); // Seulement les challenges visibles

  const ongoing = useMemo(() => (challenges ?? []).filter(c => !c.closedAt), [challenges]);
  const closed = useMemo(
    () =>
      (challenges ?? [])
        .filter(c => c.closedAt)
        .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? '')),
    [challenges],
  );
  const isEmpty = ongoing.length === 0 && closed.length === 0;

  return (
    <Layout title="Challenges">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Challenges</CardTitle>
              <CardDescription>
                Sélectionnez un challenge pour consulter les classements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-destructive">
              Une erreur est survenue lors du chargement des challenges.
            </div>
          )}

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <ChallengeCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && !error && isEmpty && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="size-12 mx-auto mb-4 opacity-20" />
              <p>Aucun challenge pour le moment.</p>
            </div>
          )}

          {!isLoading && !error && !isEmpty && (
            <div className="space-y-8">
              <ChallengeSection
                title="Challenges en cours"
                challenges={ongoing}
                emptyLabel="Aucun challenge en cours."
              />
              {closed.length > 0 && (
                <ChallengeSection title="Challenges terminés" challenges={closed} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
