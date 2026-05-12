import { AlertCircle, ArrowLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ClubForm } from '@/components/forms/ClubForm';
import { HelloAssoConnectButton } from '@/components/HelloAssoConnectButton';
import { HelloAssoUnlinkButton } from '@/components/HelloAssoUnlinkButton';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClub } from '@/hooks/useClubs';
import { useHelloAssoStatus } from '@/hooks/useHelloAssoAuth';
import type { ClubType } from '@/types/clubs';

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreating = !id;
  const clubId = id ? parseInt(id, 10) : undefined;

  const { data: club, isLoading } = useClub(clubId);
  const { data: helloAssoStatus } = useHelloAssoStatus(clubId);
  const isLinkedToHelloAsso = helloAssoStatus?.linked === true;
  const linkedSlug = helloAssoStatus?.linked ? helloAssoStatus.slug : undefined;
  const [isPending, setIsPending] = useState(false);

  const handleSuccess = (created?: ClubType) => {
    if (isCreating && created) {
      navigate(`/club/${created.id}`, { replace: true });
    } else {
      navigate('/clubs');
    }
  };

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/clubs"
        className="text-muted-foreground hover:text-white dark:hover:text-foreground transition-colors"
      >
        Clubs
      </Link>
      <ChevronRight className="size-4 text-muted-foreground" />
      <span className="font-medium">
        {isCreating
          ? 'Nouveau club'
          : club
            ? club.longName
            : <Skeleton className="h-4 w-32 inline-block" />}
      </span>
    </nav>
  );

  const toolbarLeft = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
    </div>
  );

  const toolbarRight = (
    <div className="flex items-center gap-2">
      {club?.elicenceName && clubId !== undefined ? <HelloAssoConnectButton clubId={clubId} /> : null}
      {isLinkedToHelloAsso && clubId !== undefined ? (
        <HelloAssoUnlinkButton clubId={clubId} slug={linkedSlug} />
      ) : null}
      {!isLinkedToHelloAsso && (
        <Button type="submit" form="club-form" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      )}
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

  if (!isCreating && !club) {
    return (
      <Layout title={breadcrumb} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center h-64">
          <span className="text-muted-foreground">Club introuvable</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={breadcrumb} toolbarLeft={toolbarLeft} toolbar={toolbarRight}>
      {isLinkedToHelloAsso && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Édition désactivée — ce club est lié à HelloAsso{linkedSlug ? ` (${linkedSlug})` : ''}.</strong>{' '}
            Cliquez sur <strong>Délier</strong> pour reprendre la main. La liaison est réversible via la mire.
          </div>
        </div>
      )}
      <ClubForm
        club={club}
        isCreating={isCreating}
        onSuccess={handleSuccess}
        formId="club-form"
        onPendingChange={setIsPending}
        readOnly={isLinkedToHelloAsso}
      />
    </Layout>
  );
}
