import { Trophy } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getMedalColor } from '@/utils/classements';

type PodiumIconProps = {
  rankingScratch: number | null;
  rankOfCate: number | null;
};

function getPodiumTitle(rankScratch: number | null, rankCate: number | null): string {
  const parts: string[] = [];

  if (rankScratch && rankScratch <= 3) {
    switch (rankScratch) {
      case 1:
        parts.push('Vainqueur au scratch');
        break;
      case 2:
        parts.push('2ème au scratch');
        break;
      case 3:
        parts.push('3ème au scratch');
        break;
    }
  }

  if (rankCate && rankCate <= 3) {
    switch (rankCate) {
      case 1:
        parts.push('Vainqueur dans sa catégorie');
        break;
      case 2:
        parts.push('2ème dans sa catégorie');
        break;
      case 3:
        parts.push('3ème dans sa catégorie');
        break;
    }
  }

  return parts.join(' - ');
}

export function PodiumIcon({ rankingScratch, rankOfCate }: PodiumIconProps) {
  // Afficher médaille si top 3 scratch OU top 3 catégorie
  const showScratch = rankingScratch != null && rankingScratch <= 3;
  const showCate = rankOfCate != null && rankOfCate <= 3;

  if (!showScratch && !showCate) {
    return null;
  }

  // Couleur = meilleur rang entre scratch et catégorie
  const bestRank = Math.min(
    showScratch ? rankingScratch! : 999,
    showCate ? rankOfCate! : 999
  );
  const color = getMedalColor(bestRank);

  if (!color) {
    return null;
  }

  const title = getPodiumTitle(rankingScratch, rankOfCate);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Trophy
          className="inline-block h-4 w-4 mr-1"
          style={{ color }}
          fill={color}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>{title}</p>
      </TooltipContent>
    </Tooltip>
  );
}
