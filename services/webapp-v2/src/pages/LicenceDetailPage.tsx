import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { LicencesForm } from '@/components/forms/LicencesForm.tsx';
import Layout from '@/components/layout/Layout.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useLicence } from '@/hooks/useLicences';

export default function LicenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreating = !id;
  const licenceId = id ? parseInt(id, 10) : undefined;
  const { data: licence, isLoading } = useLicence(licenceId);

  const toolbar = (
    <Button variant="outline" onClick={() => navigate('/licences')}>
      <ArrowLeft /> Retour
    </Button>
  );

  const toolbarLeft = licence && (
    <span className="text-sm text-muted-foreground">
      {licence.gender && (licence.gender === 'H' ? 'Mr' : 'Mme')}{' '}
      {licence.firstName && <strong className="text-foreground">{licence.firstName}</strong>}{' '}
      {licence.name && <strong className="text-foreground">{licence.name}</strong>}
      {licence.club && (
        <span className="ml-2">— {licence.club}</span>
      )}
      {licence.licenceNumber && (
        <span className="ml-2">
          — N° <strong className="text-foreground">{licence.licenceNumber}</strong>
        </span>
      )}
    </span>
  );

  const pageTitle = isCreating ? 'Nouvelle licence' : "Détail d'une licence";

  if (!isCreating && isLoading) {
    return (
      <Layout title={pageTitle} toolbar={toolbar}>
        <div className="flex items-center justify-center p-8">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout title={pageTitle} toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <LicencesForm
        updatingLicence={licence}
        onSuccess={() => navigate('/licences')}
      />
    </Layout>
  );
}
