import { TrendingUp } from 'lucide-react';

import { EngagedChart } from '@/components/charts/EngagedChart.tsx';
import { DashboardDataCard } from '@/components/data/DashboardDataCard.tsx';
import Layout from '@/components/layout/Layout.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useDashboard();

  if (isLoading || !dashboardData) {
    return (
      <Layout title="Tableau de bord">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <DashboardDataCard
            title="Licenciés"
            data="..."
            description="Nombre de licenciés"
            subDescription="Toutes fédérations sur la saison en cours"
          />
          <DashboardDataCard
            title="Licenciés FSGT"
            data="..."
            description="Nombre de licenciés FSGT"
            subDescription="Sur la saison en cours"
          />
          <DashboardDataCard
            title="Compétitions"
            data="..."
            description="Nombre de compétitions"
            subDescription="Sur la saison en cours"
          />
        </div>
        <div>
          <EngagedChart data={[]} />
        </div>
      </Layout>
    );
  }

  const { stats } = dashboardData;

  return (
    <Layout title="Tableau de bord">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <DashboardDataCard
          title="Licenciés"
          data={stats.totalLicenses.toString()}
          description="Nombre de licenciés"
          subDescription="Toutes fédérations sur la saison en cours"
          tag={
            <>
              <Badge variant="outline">
                <TrendingUp />+{stats.totalLicensesTrend}%
              </Badge>
            </>
          }
        />
        <DashboardDataCard
          title="Licenciés FSGT"
          data={stats.fsgtLicenses.toString()}
          description="Nombre de licenciés FSGT"
          subDescription="Sur la saison en cours"
          tag={
            <>
              <Badge variant="outline">
                <TrendingUp />+{stats.fsgtLicensesTrend}%
              </Badge>
            </>
          }
        />
        <DashboardDataCard
          title="Compétitions"
          data={stats.totalCompetitions.toString()}
          description="Nombre de compétitions"
          subDescription="Sur la saison en cours"
        />
      </div>
      <div>
        <EngagedChart data={dashboardData.engagementChart} />
      </div>
    </Layout>
  );
}
