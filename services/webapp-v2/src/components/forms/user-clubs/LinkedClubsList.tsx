import { Building2, MapPin, X } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { groupClubsByDept } from '@/lib/group-clubs-by-dept';
import { pluralize } from '@/lib/pluralize';
import type { ClubType } from '@/types/clubs';

type LinkedClubsListProps = {
  linkedClubs: ClubType[];
  deptNameByCode: Map<string, string>;
  isLoading: boolean;
  /**
   * Mode read-only : pas de bouton X pour retirer, `onRemove` peut être omis.
   * Utilisé par exemple sur l'écran "Mon compte" où l'user n'a pas le droit
   * de modifier ses propres liens (action ADMIN-only).
   */
  readOnly?: boolean;
  /** Pertinent uniquement en mode éditable. */
  isPending?: boolean;
  onRemove?: (clubId: number) => Promise<void> | void;
  /** Personnalisation du libellé d'en-tête. Default = wording UserForm admin. */
  title?: string;
  emptyMessage?: string;
};

/**
 * Bloc "Clubs actuellement liés" — badges groupés par département (chaque
 * groupe précédé d'un chip coloré). En mode éditable, chaque badge a un X
 * pour retirer le lien ; en mode read-only, le X est masqué.
 */
export function LinkedClubsList({
  linkedClubs,
  deptNameByCode,
  isLoading,
  readOnly = false,
  isPending = false,
  onRemove,
  title = 'Clubs actuellement liés à cet organisateur',
  emptyMessage = 'Aucun club lié. Utilise la recherche ci-dessus pour en ajouter.',
}: LinkedClubsListProps) {
  const groupedLinkedClubs = useMemo(
    () => groupClubsByDept(linkedClubs, deptNameByCode),
    [linkedClubs, deptNameByCode],
  );

  return (
    <div>
      <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
        <Building2 className="h-4 w-4 text-primary" aria-hidden />
        <span>{title}</span>
        {linkedClubs.length > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {linkedClubs.length}
          </span>
        )}
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : linkedClubs.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {groupedLinkedClubs.map(group => (
            <div key={group.key} className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {group.label}
                <span className="font-normal text-primary/70">
                  · {pluralize(group.clubs.length, 'club')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.clubs.map(club => (
                  <Badge key={club.id} variant="secondary" className="text-xs gap-1.5 py-1 px-2">
                    <span>{club.longName}</span>
                    {!readOnly && onRemove && (
                      <button
                        type="button"
                        onClick={() => void onRemove(club.id)}
                        className="hover:text-destructive disabled:opacity-50"
                        disabled={isPending}
                        aria-label={`Retirer ${club.longName}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
