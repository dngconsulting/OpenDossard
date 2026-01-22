import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCompetition } from '@/hooks/useCompetitions';

export default function ClassementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const competitionId = id ? parseInt(id, 10) : undefined;
  const { data: competition, isLoading } = useCompetition(competitionId);

  const toolbar = (
    <Button variant="outline" onClick={() => navigate('/competitions')}>
      <ArrowLeft /> Retour
    </Button>
  );

  const toolbarLeft = competition && (
    <span className="text-sm text-muted-foreground">
      <strong className="text-foreground">{competition.name}</strong>
    </span>
  );

  if (isLoading) {
    return (
      <Layout title="Classements" toolbar={toolbar}>
        <div className="flex items-center justify-center p-8">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Classements" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="p-8 text-center text-muted-foreground">
        Page des classements pour l'épreuve : {competition?.name}
        <br />
        <span className="text-sm">À implémenter</span>
      </div>
    </Layout>
  );
}
