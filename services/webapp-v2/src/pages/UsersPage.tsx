import { ArrowLeft, Plus, Search } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccessToast } from '@/utils/error-handler/error-handler';

import { UsersTable } from '@/components/data/UsersTable';
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
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import type { UserType } from '@/types/users';

export default function UsersPage() {
  const navigate = useNavigate();
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
  } = useUsers();

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

  const handleEditUser = useCallback(
    (user: { id: number }) => {
      navigate(`/user/${user.id}`);
    },
    [navigate]
  );

  const handleDeleteUser = useCallback((user: UserType) => {
    setUserToDelete(user);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      showSuccessToast('Utilisateur supprimé avec succès');
      setUserToDelete(null);
    } catch {
      // Error handled by global handler
    }
  }, [userToDelete, deleteUserMutation]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      // Debounce is handled in the hook
      setSearch(value);
    },
    [setSearch]
  );

  const users = data?.data || [];
  const meta = data?.meta || { offset: 0, limit: 20, total: 0, hasMore: false };

  const toolbarLeft = (
    <Button variant="outline" onClick={() => navigate(-1)}>
      <ArrowLeft className="h-4 w-4" /> Retour
    </Button>
  );

  const toolbar = (
    <Button onClick={() => navigate('/user/new')}>
      <Plus className="h-4 w-4 mr-2" />
      Ajouter un utilisateur
    </Button>
  );

  return (
    <Layout title="Utilisateurs" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="flex gap-2 w-full justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>
      <UsersTable
        users={users}
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
        onRolesChange={handleRolesChange}
        onEditUser={handleEditUser}
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
    </Layout>
  );
}
