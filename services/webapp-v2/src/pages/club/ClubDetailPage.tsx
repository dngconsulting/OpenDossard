import { AlertCircle, ArrowLeft, ChevronRight, Heart, Loader2, Lock, Save } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ClubForm } from '@/components/forms/ClubForm';
import { HelloAssoConnectButton } from '@/components/HelloAssoConnectButton';
import { HelloAssoUnlinkButton } from '@/components/HelloAssoUnlinkButton';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccessibleClubs, useClub } from '@/hooks/useClubs';
import { useHelloAssoStatus } from '@/hooks/useHelloAssoAuth';
import type { ClubType } from '@/types/clubs';

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreating = !id;
  const clubId = id ? parseInt(id, 10) : undefined;

  const { data: club, isLoading } = useClub(clubId);
  const { data: helloAssoStatus } = useHelloAssoStatus(clubId);
  const { canEditClub, isLoading: isLoadingScope } = useAccessibleClubs();
  // Hors scope = on connaît le scope ET il ne contient pas ce club. Pendant
  // le chargement du scope on reste optimiste (canEditClub renvoie true) pour
  // éviter de griser brièvement le formulaire au mount.
  const isOutOfScope = !isCreating && !isLoadingScope && !canEditClub(clubId);
  const isLinkedToHelloAsso = helloAssoStatus?.linked === true;
  const linkedSlug = helloAssoStatus?.linked ? helloAssoStatus.slug : undefined;
  const linkedAtDate = helloAssoStatus?.linked
    ? new Date(helloAssoStatus.linkedAt).toLocaleDateString('fr-FR')
    : undefined;
  const refreshExpiresDate = helloAssoStatus?.linked
    ? new Date(helloAssoStatus.refreshTokenExpiresAt).toLocaleDateString('fr-FR')
    : undefined;
  const isHelloAssoExpired = helloAssoStatus?.linked === true && helloAssoStatus.expired === true;
  // Encaissement bloqué côté HelloAsso : l'asso n'a pas finalisé ses exigences
  // admin (KYC, IBAN, statuts…). `null` = valeur inconnue → on n'affiche RIEN
  // (pas la même chose que "false"). Seul `false` strict déclenche le warning.
  const isHelloAssoCashInBlocked =
    helloAssoStatus?.linked === true && helloAssoStatus.isCashInCompliant === false;
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
        {isCreating ? (
          'Nouveau club'
        ) : club ? (
          club.longName
        ) : (
          <Skeleton className="h-4 w-32 inline-block" />
        )}
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
      {club?.elicenceName && clubId !== undefined ? (
        <HelloAssoConnectButton clubId={clubId} />
      ) : null}
      {isLinkedToHelloAsso && clubId !== undefined ? (
        <HelloAssoUnlinkButton clubId={clubId} slug={linkedSlug} />
      ) : null}
      {!isLinkedToHelloAsso && !isOutOfScope && (
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
      {isOutOfScope && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Vous n&apos;êtes pas lié à ce club.</strong> Consultation en lecture seule —
            demandez à un administrateur de vous y rattacher pour pouvoir modifier ses informations.
          </div>
        </div>
      )}
      {isHelloAssoCashInBlocked && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Encaissement impossible{linkedSlug ? ` pour « ${linkedSlug} »` : ''}.</strong>{' '}
            Votre association doit absolument finaliser ses exigences administratives
            (justificatifs, IBAN, statuts…) dans son espace HelloAsso. Tant que ce point n&apos;est
            pas réglé, aucun paiement ne peut être réalisé ni encaissé.
          </div>
        </div>
      )}
      {isLinkedToHelloAsso && (
        <div
          className={
            isHelloAssoExpired
              ? 'mb-4 flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200'
              : 'mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
          }
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            {isHelloAssoExpired ? (
              <>
                <div>
                  <strong>Liaison HelloAsso expirée{linkedSlug ? ` (${linkedSlug})` : ''}.</strong>{' '}
                  Les paiements en ligne ne fonctionneront plus tant que la liaison n&apos;est pas
                  renouvelée.
                </div>
                <div className="text-xs">
                  Connecté le <strong>{linkedAtDate}</strong>. Refresh token expiré depuis le{' '}
                  <strong>{refreshExpiresDate}</strong>.
                </div>
                <div>
                  Cliquez sur <strong>Lier à HelloAsso</strong> pour restaurer la liaison.
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong>
                    Édition désactivée — ce club est lié à HelloAsso
                    {linkedSlug ? ` (${linkedSlug})` : ''}.
                  </strong>{' '}
                  Cliquez sur <strong>Délier</strong> pour reprendre la main. La liaison est
                  réversible via la mire.
                </div>
                <div className="text-xs">
                  Connecté le <strong>{linkedAtDate}</strong>. Renouvellement nécessaire avant le{' '}
                  <strong>{refreshExpiresDate}</strong>.
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {isLinkedToHelloAsso && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
          <Heart className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            HelloAsso aide les associations à collecter des paiements en ligne et propose ses
            services gratuitement. Elle prend à sa charge tous les frais de transaction pour que
            vous puissiez bénéficier de la totalité des sommes versées par vos publics, sans frais.
            Les contributions volontaires laissées par ces derniers sont leur unique source de
            revenus.
          </div>
        </div>
      )}
      <ClubForm
        club={club}
        isCreating={isCreating}
        onSuccess={handleSuccess}
        formId="club-form"
        onPendingChange={setIsPending}
        readOnly={isLinkedToHelloAsso || isOutOfScope}
      />
    </Layout>
  );
}
