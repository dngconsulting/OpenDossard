import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PaymentsTable } from '@/components/data/PaymentsTable';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { usePayments } from '@/hooks/usePayments';

export default function PaymentsHistoryPage() {
  const navigate = useNavigate();
  // Le hook partage la queryKey avec celle de PaymentsTable (`['payments',
  // 'all', params]`) — React Query hash structurellement les params depuis
  // useSearchParams, donc même cache entry → 1 seul appel réseau. Cf. design
  // 2026-05-17 §3.b. À l'avenir, si on a besoin d'orchestrer plus que `total`,
  // passer une prop `onMetaChange` à PaymentsTable serait plus explicite.
  const { data } = usePayments({ kind: 'all' });
  const total = data?.meta?.total ?? 0;

  const toolbarLeft = (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
      <span className="text-sm text-muted-foreground">
        Nombre de paiements : <strong className="text-foreground">{total}</strong>
      </span>
    </div>
  );

  return (
    <Layout title="Historique des paiements" toolbarLeft={toolbarLeft}>
      <PaymentsTable scope={{ kind: 'all' }} />
    </Layout>
  );
}
