import { FileSpreadsheet, FileText, Loader2, MoreHorizontal, Plus, Search, X } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useClubsPaginated, useDeleteClub } from '@/hooks/useClubs';
import { useExportClubsCSV } from '@/hooks/useExportClubsCSV';
import { useExportClubsPDF } from '@/hooks/useExportClubsPDF';
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

  const clubs = data?.data || [];
  const meta = data?.meta || { offset: 0, limit: 20, total: 0, hasMore: false };
  const totalClubs = meta.total;

  const { exportPDF, isExporting: isExportingPDF } = useExportClubsPDF(params, totalClubs);
  const { exportCSV, isExporting: isExportingCSV } = useExportClubsCSV(params, totalClubs);

  const getEditClubHref = useCallback(
    (club: ClubType) => `/club/${club.id}`,
    [],
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

  const toolbarLeft = (
    <span className="text-sm text-muted-foreground">
      Nombre de clubs : <strong className="text-foreground">{totalClubs}</strong>
    </span>
  );

  const toolbar = (
    <>
      <Button onClick={() => navigate('/club/new')}>
        <Plus className="h-4 w-4" /> Ajouter un club
      </Button>
      {/* Desktop: boutons visibles */}
      <Button
        variant="action"
        className="hidden md:flex"
        onClick={exportPDF}
        disabled={isExportingPDF}
      >
        {isExportingPDF ? <Loader2 className="animate-spin" /> : <FileText />}
        Export PDF
      </Button>
      <Button
        variant="action"
        className="hidden md:flex"
        onClick={exportCSV}
        disabled={isExportingCSV}
      >
        {isExportingCSV ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
        Export CSV
      </Button>
      {/* Mobile: menu déroulant */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="md:hidden">
          <Button variant="action" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportPDF} disabled={isExportingPDF}>
            {isExportingPDF ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportCSV} disabled={isExportingCSV}>
            {isExportingCSV ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
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
        getEditClubHref={getEditClubHref}
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
