import { Search } from 'lucide-react';
import { useState, useCallback } from 'react';

import { UsersTable } from '@/components/data/UsersTable';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { useUsers, useUpdateUser } from '@/hooks/useUsers';

export default function UsersPage() {
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

  const [searchInput, setSearchInput] = useState(params.search || '');

  const handleRolesChange = useCallback(
    (userId: number, roles: string) => {
      updateUserMutation.mutate({ id: userId, updates: { roles } });
    },
    [updateUserMutation]
  );

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

  return (
    <Layout title="Utilisateurs">
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
      />
    </Layout>
  );
}
