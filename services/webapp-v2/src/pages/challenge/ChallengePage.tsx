import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ChallengeRankingTable } from '@/components/challenges/ChallengeRankingTable';
import { GenderToggle } from '@/components/challenges/GenderToggle';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COMPETITION_TYPE_ICONS } from '@/config/competition-type.config';
import { filterRiders, useChallenge, useChallengeRanking } from '@/hooks/useChallenges';
import { COMPETITION_TYPE_LABELS } from '@/types/api';
import type { GenderType } from '@/types/challenges';
import { exportChallengePDF } from '@/utils/pdf-exports';


export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const challengeId = id ? parseInt(id, 10) : undefined;

  const { data: challenge } = useChallenge(challengeId);
  const { data: ranking, isLoading: isLoadingRanking } = useChallengeRanking(challengeId);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState<GenderType>('H');

  const tabsRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    if (!ranking) {
      return [];
    }
    return [
      ...new Set(ranking.map(r => r.currentLicenceCatev).filter((v): v is string => !!v)),
    ].sort();
  }, [ranking]);

  // Select first category when categories become available
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0] ?? '');
    }
  }, [categories, selectedCategory]);

  const filteredRiders = useMemo(() => {
    if (selectedCategory === 'DAMES') {
      return filterRiders(ranking, selectedCategory, undefined);
    }
    return filterRiders(ranking, selectedCategory, selectedGender);
  }, [ranking, selectedCategory, selectedGender]);

  // Count riders per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      if (cat === 'DAMES') {
        counts[cat] = filterRiders(ranking, cat, undefined).length;
      } else {
        counts[cat] = filterRiders(ranking, cat, selectedGender).length;
      }
    }
    return counts;
  }, [ranking, categories, selectedGender]);

  // Extract unique competitions from ranking data
  const competitions = useMemo(() => {
    if (!ranking) return [];
    const competitionsMap = new Map<number, { id: number; name: string; date: string }>();
    for (const rider of ranking) {
      for (const race of rider.challengeRaceRows || []) {
        if (race.competitionId && race.competitionName && !competitionsMap.has(race.competitionId)) {
          competitionsMap.set(race.competitionId, {
            id: race.competitionId,
            name: race.competitionName,
            date: race.eventDate || '',
          });
        }
      }
    }
    return Array.from(competitionsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [ranking]);

  const handleExportPDF = async () => {
    if (!challenge || !ranking || ranking.length === 0) {
      return;
    }
    await exportChallengePDF(challenge, ranking);
  };

  const Icon = challenge?.competitionType
    ? COMPETITION_TYPE_ICONS[challenge.competitionType] ?? null
    : null;
  const typeLabel = challenge?.competitionType
    ? COMPETITION_TYPE_LABELS[challenge.competitionType] || challenge.competitionType
    : '';

  const toolbarLeft = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Retour
      </Button>
      {challenge && (
        <>
          <Badge className="bg-slate-600 text-white hover:bg-slate-600 gap-1">
            {Icon && <Icon className="size-5" />}
            {typeLabel}
          </Badge>
          <Badge
            className={
              challenge.active
                ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                : 'bg-gray-500 text-white hover:bg-gray-500'
            }
          >
            {challenge.active ? 'Actif' : 'Terminé'}
          </Badge>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors ml-2"
              >
                Liste des courses ({challenge.competitionIds?.length || 0})
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Courses du challenge</DialogTitle>
              </DialogHeader>
              <div className="max-h-80 overflow-y-auto">
                {competitions.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    Aucune course trouvée
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {competitions.map(comp => (
                      <li key={comp.id}>
                        <Link
                          to={`/competition/${comp.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                        >
                          <Calendar className="size-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                              {comp.name}
                            </p>
                            {comp.date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(comp.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-2">
      {selectedCategory !== 'DAMES' && (
        <GenderToggle value={selectedGender} onChange={setSelectedGender} />
      )}
      {challenge?.reglement && (
        <Button
          variant="outline"
          onClick={() => window.open(challenge.reglement, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="size-4" />
          Règlement
        </Button>
      )}
      <Button
        variant="outline"
        onClick={handleExportPDF}
        disabled={!ranking || ranking.length === 0}
      >
        <Download className="size-4" />
        Export PDF
      </Button>
    </div>
  );

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/challenges"
        className="text-muted-foreground hover:text-white dark:hover:text-foreground transition-colors"
      >
        Challenges
      </Link>
      <ChevronRight className="size-4 text-muted-foreground" />
      <span className="font-medium">
        {challenge?.name || <Skeleton className="h-4 w-32 inline-block" />}
      </span>
    </nav>
  );

  return (
    <Layout title={breadcrumb} toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div>
        {/* Category Tabs */}
        {categories.length > 0 && selectedCategory !== '' && (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList
              ref={tabsRef}
              className="mb-0 flex w-full justify-start gap-0 rounded-t-xl rounded-b-none bg-muted/50 p-0 h-auto overflow-x-auto scrollbar-none border-0"
            >
              {categories.map(cat => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                >
                  <span className="text-base font-bold">
                    {/^\d+$/.test(cat) ? `Caté ${cat}` : cat}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {categoryCounts[cat] || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Ranking Table */}
        <ChallengeRankingTable riders={filteredRiders} isLoading={isLoadingRanking} />
      </div>
    </Layout>
  );
}
