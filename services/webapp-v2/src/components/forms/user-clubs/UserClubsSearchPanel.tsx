import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClubsLegacySearch } from '@/hooks/useClubs';
import { groupClubsByDept } from '@/lib/group-clubs-by-dept';
import { pluralize } from '@/lib/pluralize';
import type { ClubType } from '@/types/clubs';
import type { DepartmentType } from '@/types/departments';

// Seules FSGT et UFOLEP ont aujourd'hui des clubs gérés via OpenDossard.
// Si d'autres fédés sont introduites côté DB, ajouter ici.
const FEDES = ['FSGT', 'UFOLEP'] as const;
const FEDE_ALL_VALUE = '__all__';
const RESULTS_LIMIT = 200;

type UserClubsSearchPanelProps = {
  linkedIdsSet: Set<number>;
  deptNameByCode: Map<string, string>;
  departments: DepartmentType[];
  isPending: boolean;
  onAdd: (clubIds: number[]) => Promise<void> | void;
};

/**
 * Bloc "Recherche + ajout" de la section Clubs gérés.
 *
 * - Filtres cumulables : recherche par nom (côté client), fédération
 *   (single-select), départements (multi-select).
 * - Résultats groupés par département (cf. `groupClubsByDept`).
 * - Barre d'actions `sticky top-0` (Tout sélectionner + Ajouter) reste visible
 *   pendant le scroll de la liste.
 * - State interne : filtres + sélection. Le composant remonte uniquement les
 *   `clubIds` choisis via `onAdd` ; le parent gère l'appel API.
 */
export function UserClubsSearchPanel({
  linkedIdsSet,
  deptNameByCode,
  departments,
  isPending,
  onAdd,
}: UserClubsSearchPanelProps) {
  const [searchName, setSearchName] = useState('');
  const [fedeFilter, setFedeFilter] = useState<string>(FEDE_ALL_VALUE);
  const [deptCodes, setDeptCodes] = useState<string[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());

  const fedeForApi = fedeFilter === FEDE_ALL_VALUE ? undefined : fedeFilter;
  const searchEnabled = !!fedeForApi || deptCodes.length > 0;

  const searchQuery = useClubsLegacySearch({ fede: fedeForApi, depts: deptCodes });

  const departmentOptions: MultiSelectOption[] = useMemo(
    () => departments.map(d => ({ value: d.code, label: `${d.name} (${d.code})` })),
    [departments],
  );

  // Filtre par nom côté client (l'endpoint legacy ne supporte pas search).
  const filteredResults: ClubType[] = useMemo(() => {
    const raw = searchQuery.data ?? [];
    const q = searchName.trim().toLowerCase();
    if (!q) {return raw;}
    return raw.filter(
      c =>
        c.longName.toLowerCase().includes(q) ||
        (c.shortName?.toLowerCase().includes(q) ?? false),
    );
  }, [searchQuery.data, searchName]);

  const truncated = filteredResults.length > RESULTS_LIMIT;
  const visibleResults = truncated ? filteredResults.slice(0, RESULTS_LIMIT) : filteredResults;
  const addableVisible = visibleResults.filter(c => !linkedIdsSet.has(c.id));
  const selectedAddable = visibleResults.filter(
    c => selectedToAdd.has(c.id) && !linkedIdsSet.has(c.id),
  );

  const groupedResults = useMemo(
    () => groupClubsByDept(visibleResults, deptNameByCode),
    [visibleResults, deptNameByCode],
  );

  const allAddableVisibleChecked =
    addableVisible.length > 0 && addableVisible.every(c => selectedToAdd.has(c.id));

  const handleToggleOne = (clubId: number, checked: boolean) => {
    setSelectedToAdd(prev => {
      const next = new Set(prev);
      if (checked) {next.add(clubId);}
      else {next.delete(clubId);}
      return next;
    });
  };

  const handleToggleAllVisible = (checked: boolean) => {
    setSelectedToAdd(prev => {
      const next = new Set(prev);
      if (checked) {addableVisible.forEach(c => next.add(c.id));}
      else {addableVisible.forEach(c => next.delete(c.id));}
      return next;
    });
  };

  const handleAddSelection = async () => {
    if (selectedAddable.length === 0) {return;}
    await onAdd(selectedAddable.map(c => c.id));
    setSelectedToAdd(new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Rechercher un club par nom…"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="h-9 flex-1"
        />
        <Select value={fedeFilter} onValueChange={setFedeFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue placeholder="Fédération" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FEDE_ALL_VALUE}>Toutes fédés</SelectItem>
            {FEDES.map(f => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <MultiSelect
          options={departmentOptions}
          selected={deptCodes}
          onChange={setDeptCodes}
          placeholder="Départements"
          className="w-full sm:w-56"
        />
      </div>

      {!searchEnabled ? (
        <p className="text-sm text-muted-foreground py-2">
          Sélectionne une fédération ou un département pour afficher des clubs.
        </p>
      ) : searchQuery.isLoading ? (
        <p className="text-sm text-muted-foreground py-2">Recherche…</p>
      ) : filteredResults.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Aucun club ne correspond à ces filtres.
        </p>
      ) : (
        <>
          {/* Container scrollable unique : la barre d'actions est sticky pour
              rester visible quand l'utilisateur fait défiler une longue liste. */}
          <div className="max-h-[500px] overflow-y-auto border rounded-md bg-background">
            <div className="sticky top-0 z-10 bg-background border-b px-3 py-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={allAddableVisibleChecked}
                  onCheckedChange={checked => handleToggleAllVisible(!!checked)}
                  disabled={addableVisible.length === 0}
                />
                <span>
                  Tout sélectionner ({pluralize(addableVisible.length, 'ajoutable')}
                  {truncated ? ` sur ${filteredResults.length}` : ''})
                </span>
              </label>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleAddSelection()}
                disabled={selectedAddable.length === 0 || isPending}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Ajouter ({selectedAddable.length})
              </Button>
            </div>

            <div>
              {groupedResults.map(group => (
                <div key={group.key}>
                  <div className="bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80 border-t first:border-t-0 border-b">
                    {group.label}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      · {pluralize(group.clubs.length, 'club')}
                    </span>
                  </div>
                  <div className="divide-y">
                    {group.clubs.map(club => {
                      const isLinked = linkedIdsSet.has(club.id);
                      const isChecked = selectedToAdd.has(club.id);
                      return (
                        <label
                          key={club.id}
                          className={`flex items-center gap-2 px-3 py-2 text-sm ${
                            isLinked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isLinked || isChecked}
                            disabled={isLinked || isPending}
                            onCheckedChange={checked => handleToggleOne(club.id, !!checked)}
                          />
                          <span className="flex-1">
                            <span className="font-medium">{club.longName}</span>
                            {club.shortName && club.shortName !== club.longName && (
                              <span className="text-muted-foreground"> · {club.shortName}</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {club.fede ?? '-'}
                          </span>
                          {isLinked && (
                            <span className="text-xs text-muted-foreground italic">déjà lié</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {truncated && (
            <p className="text-xs text-muted-foreground italic">
              Affichage limité aux {RESULTS_LIMIT} premiers résultats sur {filteredResults.length}.
              Affine les filtres pour réduire la liste.
            </p>
          )}
        </>
      )}
    </div>
  );
}
