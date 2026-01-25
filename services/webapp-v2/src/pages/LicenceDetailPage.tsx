import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { LicencesForm } from '@/components/forms/LicencesForm.tsx';
import Layout from '@/components/layout/Layout.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useLicence } from '@/hooks/useLicences';

export default function LicenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreating = !id;
  const licenceId = id ? parseInt(id, 10) : undefined;
  const { data: licence, isLoading } = useLicence(licenceId);
  const [formValues, setFormValues] = useState<{ name: string; firstName: string }>({ name: '', firstName: '' });

  const displayName = isCreating
    ? (formValues.firstName || formValues.name
        ? `${formValues.firstName} ${formValues.name}`.trim()
        : 'Nouvelle licence')
    : licence
      ? `${licence.firstName} ${licence.name}`
      : null;

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/licences"
        className="text-muted-foreground hover:text-white dark:hover:text-foreground transition-colors"
      >
        Licences
      </Link>
      <ChevronRight className="size-4 text-muted-foreground" />
      <span className="font-medium">
        {displayName || <Skeleton className="h-4 w-32 inline-block" />}
      </span>
    </nav>
  );

  const toolbarLeft = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate('/licences')}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
      {licence && (
        <>
          {licence.club && (
            <Badge className="bg-slate-600 text-white hover:bg-slate-600">
              {licence.club}
            </Badge>
          )}
          {licence.licenceNumber && (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              N° {licence.licenceNumber}
            </Badge>
          )}
        </>
      )}
    </div>
  );

  if (!isCreating && isLoading) {
    return (
      <Layout title={breadcrumb} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout title={breadcrumb} toolbarLeft={toolbarLeft}>
      <LicencesForm
        updatingLicence={licence}
        onSuccess={() => navigate('/licences')}
        onFormValuesChange={setFormValues}
      />
    </Layout>
  );
}
