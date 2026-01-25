import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bike,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Mountain,
  TreePine,
  Trophy,
} from 'lucide-react';

import { ChallengeRankingTable } from '@/components/challenges/ChallengeRankingTable';
import { GenderToggle } from '@/components/challenges/GenderToggle';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { filterRiders, useChallenge, useChallengeRanking } from '@/hooks/useChallenges';
import type { GenderType } from '@/types/challenges';
import { exportChallengePDF } from '@/utils/pdf-exports';

const competitionTypeIcons: Record<string, React.ReactNode> = {
  ROUTE: <Bike className="size-5" />,
  CX: <TreePine className="size-5" />,
  VTT: <Mountain className="size-5" />,
};

const competitionTypeLabels: Record<string, string> = {
  ROUTE: 'Route',
  CX: 'Cyclo-cross',
  VTT: 'VTT',
};

function getCategories(competitionType: string | undefined) {
  if (competitionType === 'CX') {
    return ['1', '2', '3', '4', '5', 'DAMES'];
  }
  return ['1', '2', '3', '4', '5'];
}

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const challengeId = id ? parseInt(id, 10) : undefined;

  const { data: challenge, isLoading: isLoadingChallenge } = useChallenge(challengeId);
  const { data: ranking, isLoading: isLoadingRanking } = useChallengeRanking(challengeId);

  const [selectedCategory, setSelectedCategory] = useState('1');
  const [selectedGender, setSelectedGender] = useState<GenderType>('H');

  // Scroll indicators for tabs
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categories = useMemo(() => getCategories(challenge?.competitionType), [challenge?.competitionType]);

  const checkScrollPosition = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition, categories]);

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

  const handleExportPDF = async () => {
    if (!challenge || !ranking || ranking.length === 0) return;
    await exportChallengePDF(challenge, ranking);
  };

  const icon = challenge?.competitionType
    ? competitionTypeIcons[challenge.competitionType] || <Bike className="size-5" />
    : null;
  const typeLabel = challenge?.competitionType
    ? competitionTypeLabels[challenge.competitionType] || challenge.competitionType
    : '';

  const toolbarLeft = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate('/challenges')}>
        <ArrowLeft className="size-4" /> Retour
      </Button>
      {challenge && (
        <>
          <Badge className="bg-slate-600 text-white hover:bg-slate-600 gap-1">
            {icon}
            {typeLabel}
          </Badge>
          <Badge className={challenge.active ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'bg-gray-500 text-white hover:bg-gray-500'}>
            {challenge.active ? 'Actif' : 'Terminé'}
          </Badge>
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
      <Button variant="outline" onClick={handleExportPDF} disabled={!ranking || ranking.length === 0}>
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
      <div className="space-y-2">
        {/* Category Tabs */}
        {categories.length > 0 && (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <div className="relative flex items-center gap-1">
              <div className={`shrink-0 transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </div>

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
                      {cat === 'DAMES' ? 'Dames' : `Caté ${cat}`}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryCounts[cat] || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className={`shrink-0 transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Tabs>
        )}

        {/* Ranking Table */}
        <ChallengeRankingTable
          riders={filteredRiders}
          isLoading={isLoadingRanking}
        />
      </div>
    </Layout>
  );
}
