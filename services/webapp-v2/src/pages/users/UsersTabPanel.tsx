import { useState, useCallback } from 'react';

import { UsersTable } from '@/components/data/UsersTable';
import { Button } from '@/components/ui/button';
import { DebouncedSearchInput } from '@/components/ui/debounced-search-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import type { UserType, UserSource } from '@/types/users';
import { showSuccessToast } from '@/utils/error-handler/error-handler';

type Props = {
  source: UserSource;
};

/**
 * Contenu d'un onglet de la page Utilisateurs : recherche + tableau paginé,
 * alimenté par GET /users?source=… Le caractère readonly de l'onglet
 * 'dossardeur' (users mobile Firebase) est porté par UsersTable via `variant`.
 */
export function UsersTabPanel({ source }: Props) {
  const {
    data,
    isLoading,
    params,
    setSearch,
    setSort,
    goToPage,
    setLimit,
    currentPage,
    totalPages,
  } = useUsers(source);

  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [searchInput, setSearchInput] = useState(params.search || '');
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const handleRolesChange = useCallback(
    (userId: number, roles: string) => {
      updateUserMutation.mutate({ id: userId, updates: { roles } });
    },
    [updateUserMutation]
  );

  const getEditUserHref = useCallback(
    (user: { id: number }) => `/user/${user.id}`,
    [],
  );

  const handleDeleteUser = useCallback((user: UserType) => {
    setUserToDelete(user);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!userToDelete) {return;}
    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      showSuccessToast('Utilisateur supprimé avec succès');
      setUserToDelete(null);
    } catch {
      // Error handled by global handler
    }
  }, [userToDelete, deleteUserMutation]);

  const users = data?.data || [];
  const meta = data?.meta || { offset: 0, limit: 20, total: 0, hasMore: false };

  return (
    <>
      <div className="flex gap-2 w-full justify-between items-center mb-4">
        <DebouncedSearchInput
          value={searchInput}
          onValueChange={setSearchInput}
          onSearch={setSearch}
          placeholder="Rechercher un utilisateur..."
        />
      </div>
      <UsersTable
        users={users}
        isLoading={isLoading}
        variant={source}
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
        onRolesChange={handleRolesChange}
        getEditUserHref={getEditUserHref}
        onDeleteUser={handleDeleteUser}
      />

      <Dialog open={!!userToDelete} onOpenChange={open => !open && setUserToDelete(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur ?</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>{' '}
              ({userToDelete?.email}) ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
