import { DashboardDataCard } from '@/components/data/DashboardDataCard.tsx';
import Layout from '@/components/layout/Layout.tsx';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useDashboard();

  if (isLoading || !dashboardData) {
    return (
      <Layout title="Tableau de bord">
        <div className="grid auto-rows-min gap-4 md:grid-cols-2">
          <DashboardDataCard
            title="Licenciés"
            data="..."
            description="Nombre de licenciés"
            subDescription="Toutes fédérations sur la saison en cours"
          />
          <DashboardDataCard
            title="Épreuves"
            data="..."
            description="Nombre d'épreuves"
            subDescription="Sur la saison en cours"
          />
        </div>
      </Layout>
    );
  }

  const { stats } = dashboardData;

  return (
    <Layout title="Tableau de bord">
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <DashboardDataCard
          title="Licenciés"
          data={stats.totalLicenses.toString()}
          description="Nombre de licenciés"
          subDescription="Toutes fédérations sur la saison en cours"
        />
        <DashboardDataCard
          title="Épreuves"
          data={stats.totalCompetitions.toString()}
          description="Nombre d'épreuves"
          subDescription="Sur la saison en cours"
        />
      </div>
    </Layout>
  );
}
