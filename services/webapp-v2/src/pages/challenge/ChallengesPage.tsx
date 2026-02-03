import { Trophy } from 'lucide-react';

import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/hooks/useChallenges';

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

export default function ChallengesPage() {
  const { data: challenges, isLoading, error } = useChallenges(true); // Only active challenges

  return (
    <Layout title="Challenges">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Challenges actifs</CardTitle>
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

          {!isLoading && !error && challenges && challenges.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="size-12 mx-auto mb-4 opacity-20" />
              <p>Aucun challenge actif pour le moment.</p>
            </div>
          )}

          {!isLoading && !error && challenges && challenges.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
