import { cn } from '@/lib/utils';

type Props = {
  author?: string | null;
  lastChanged?: string | null;
  className?: string;
};

/**
 * Trace d'audit « Dernière modification le … à … par … », affichée en bas des
 * fiches de détail (licence, club, épreuve). Visible par tous les utilisateurs.
 * Ne rend rien tant que `author` ET `lastChanged` ne sont pas tous les deux
 * renseignés (entité jamais modifiée, ou champs absents de la réponse).
 */
export function LastModificationInfo({ author, lastChanged, className }: Props) {
  if (!lastChanged || !author) {
    return null;
  }
  const date = new Date(lastChanged);
  return (
    <div className={cn('text-sm text-muted-foreground border-t pt-4', className)}>
      Dernière modification le {date.toLocaleDateString('fr-FR')} à{' '}
      {date.toLocaleTimeString('fr-FR')} par {author}
    </div>
  );
}
