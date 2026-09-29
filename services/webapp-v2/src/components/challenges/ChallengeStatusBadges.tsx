import { Badge } from '@/components/ui/badge';
import type { ChallengeType } from '@/types/challenges';

type Props = { challenge: ChallengeType };

/** En cours / Terminé le … (closedAt), et Masqué si active = false. */
export function ChallengeStatusBadges({ challenge }: Props) {
  return (
    <>
      {challenge.closedAt ? (
        <Badge className="bg-gray-500 text-white hover:bg-gray-500">
          Terminé le {new Date(challenge.closedAt).toLocaleDateString('fr-FR')}
        </Badge>
      ) : (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">En cours</Badge>
      )}
      {!challenge.active && <Badge variant="outline">Masqué</Badge>}
    </>
  );
}
