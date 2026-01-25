import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { UserForm } from '@/components/forms/UserForm';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/useUsers';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreating = !id;
  const userId = id ? parseInt(id, 10) : undefined;

  const { data: user, isLoading } = useUser(userId);

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/users"
        className="text-muted-foreground hover:text-white dark:hover:text-foreground transition-colors"
      >
        Utilisateurs
      </Link>
      <ChevronRight className="size-4 text-muted-foreground" />
      <span className="font-medium">
        {isCreating
          ? 'Nouvel utilisateur'
          : user
            ? `${user.firstName} ${user.lastName}`
            : <Skeleton className="h-4 w-32 inline-block" />}
      </span>
    </nav>
  );

  const toolbarLeft = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate('/users')}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
    </div>
  );

  if (!isCreating && isLoading) {
    return (
      <Layout title={breadcrumb} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center h-64">
          <span className="text-muted-foreground">Chargement...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={breadcrumb} toolbarLeft={toolbarLeft}>
      <div className="max-w-2xl">
        <UserForm
          user={user}
          isCreating={isCreating}
          onSuccess={() => navigate('/users')}
        />
      </div>
    </Layout>
  );
}
