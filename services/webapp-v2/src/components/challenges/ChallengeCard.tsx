import { Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { COMPETITION_TYPE_ICONS } from '@/config/competition-type.config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { COMPETITION_TYPE_LABELS } from '@/types/api';
import type { ChallengeType } from '@/types/challenges';

type Props = {
  challenge: ChallengeType;
};


export function ChallengeCard({ challenge }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/challenges/${challenge.id}`);
  };

  const handleReglementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (challenge.reglement) {
      window.open(challenge.reglement, '_blank', 'noopener,noreferrer');
    }
  };

  const Icon = COMPETITION_TYPE_ICONS[challenge.competitionType] ?? null;
  const typeLabel = COMPETITION_TYPE_LABELS[challenge.competitionType] || challenge.competitionType;
  const nbCompetitions = challenge.competitionIds?.length || 0;

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            {Icon && <Icon className="size-5" />}
            <span className="text-sm font-medium">{typeLabel}</span>
          </div>
          <Badge variant={challenge.active ? 'default' : 'secondary'}>
            {challenge.active ? 'Actif' : 'Terminé'}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {challenge.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3">
        {challenge.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {challenge.description}
          </CardDescription>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            <span>{nbCompetitions} course{nbCompetitions > 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {challenge.reglement && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleReglementClick}
          >
            <ExternalLink className="size-3.5" />
            Règlement
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Voir le classement
        </Button>
      </CardFooter>
    </Card>
  );
}
