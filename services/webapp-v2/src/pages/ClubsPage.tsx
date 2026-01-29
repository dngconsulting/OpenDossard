import { ArrowLeft, Plus, Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccessToast } from '@/utils/error-handler/error-handler';

import { ClubsTable } from '@/components/data/ClubsTable';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useClubsPaginated, useDeleteClub } from '@/hooks/useClubs';
import type { ClubType } from '@/types/clubs';

export default function ClubsPage() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    params,
    setSearch,
    setSort,
    setFilter,
    goToPage,
    setLimit,
    currentPage,
    totalPages,
  } = useClubsPaginated();

  const deleteClubMutation = useDeleteClub();

  const [searchInput, setSearchInput] = useState(params.search || '');
  const [clubToDelete, setClubToDelete] = useState<ClubType | null>(null);

  const handleEditClub = useCallback(
    (club: ClubType) => {
      navigate(`/club/${club.id}`);
    },
    [navigate],
  );

  const handleDeleteClub = useCallback((club: ClubType) => {
    setClubToDelete(club);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!clubToDelete) return;
    try {
      await deleteClubMutation.mutateAsync(clubToDelete.id);
      showSuccessToast('Club supprimé avec succès');
      setClubToDelete(null);
    } catch {
      // Error handled by global handler (toast displays 409 message)
      setClubToDelete(null);
    }
  }, [clubToDelete, deleteClubMutation]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      setSearch(value);
    },
    [setSearch],
  );

  const clubs = data?.data || [];
  const meta = data?.meta || { offset: 0, limit: 20, total: 0, hasMore: false };

  const toolbarLeft = (
    <Button variant="outline" onClick={() => navigate(-1)}>
      <ArrowLeft className="h-4 w-4" /> Retour
    </Button>
  );

  const toolbar = (
    <Button onClick={() => navigate('/club/new')}>
      <Plus className="h-4 w-4" /> Ajouter un club
    </Button>
  );

  return (
    <Layout title="Clubs" toolbarLeft={toolbarLeft} toolbar={toolbar}>
      <div className="flex gap-2 w-full justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un club..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <ClubsTable
        clubs={clubs}
        isLoading={isLoading}
        pagination={{
          meta,
          currentPage,
          totalPages,
          goToPage,
          setLimit,
        }}
        sorting={{
          sortColumn: params.orderBy,
          sortDirection: params.orderDirection,
          onSortChange: setSort,
        }}
        serverFilters={(params.filters as Record<string, string>) || {}}
        onFilterChange={(columnId, value) => setFilter(columnId as keyof ClubType, value)}
        onEditClub={handleEditClub}
        onDeleteClub={handleDeleteClub}
      />

      <Dialog open={!!clubToDelete} onOpenChange={open => !open && setClubToDelete(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Supprimer le club ?</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le club{' '}
              <strong>{clubToDelete?.longName}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClubToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
