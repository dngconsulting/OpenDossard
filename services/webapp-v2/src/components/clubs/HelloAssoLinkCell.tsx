import { HelloAssoRoundLogo } from '@/components/common/HelloAssoRoundLogo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ClubType } from '@/types/clubs';

/** ISO → Date, ou null si absent/invalide (le backend garantit l'ISO, on reste défensif). */
const parseDate = (iso: string | null | undefined): Date | null => {
  if (!iso) {return null;}
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date: Date) => date.toLocaleDateString('fr-FR');

/**
 * Colonne « HA » de la liste des clubs : rond HelloAsso si le club a une
 * liaison, atténué si le refresh token est expiré (l'admin du club doit
 * repasser par la mire). Rien si pas de liaison.
 */
export function HelloAssoLinkCell({ club }: { club: ClubType }) {
  const linkedAt = parseDate(club.helloAssoLinkedAt);
  if (!linkedAt) {
    return null;
  }
  const expiresAt = parseDate(club.helloAssoRefreshTokenExpiresAt);
  const expired = expiresAt !== null && expiresAt.getTime() < Date.now();
  const label = expired
    ? `Liaison expirée le ${formatDate(expiresAt)}, à refaire via la mire`
    : `Liée le ${formatDate(linkedAt)}`;

  // `Tooltip` embarque déjà son TooltipProvider. Le déclencheur est focalisable
  // pour que l'infobulle soit atteignable au clavier ; `role="img"` rend le
  // SVG enfant présentationnel et porte le libellé accessible.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="img"
          aria-label={label}
          className={expired ? 'inline-flex opacity-40 grayscale' : 'inline-flex'}
        >
          <HelloAssoRoundLogo size="1.1rem" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
