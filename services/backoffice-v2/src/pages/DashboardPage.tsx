import {TrendingUp} from 'lucide-react';

import {EngagedChart} from '@/components/charts/EngagedChart.tsx';
import {DashboardDataCard} from '@/components/data/DashboardDataCard.tsx';
import Layout from '@/components/layout/Layout.tsx';
import {Badge} from '@/components/ui/badge.tsx';



export default function DashboardPage() {
    return (
        <Layout title="Tableau de bord">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <DashboardDataCard
                    title="Licenciés"
                    data="1264"
                    description="Nombre de licenciés"
                    subDescription="Toutes fédérations sur la saison en cours"
                    tag={
                        <>
                            <Badge variant="outline">
                                <TrendingUp/>
                                +3.5%
                            </Badge>
                        </>
                    }
                />
                <DashboardDataCard
                    title="Licenciés FSGT"
                    data="1264"
                    description="Nombre de licenciés FSGT"
                    subDescription="Sur la saison en cours"
                    tag={
                        <>
                            <Badge variant="outline">
                                <TrendingUp/>
                                +2.5%
                            </Badge>
                        </>
                    }
                />
                <DashboardDataCard
                    title="Compétitions"
                    data="143"
                    description="Nombre de compétitions"
                    subDescription="Sur la saison en cours"
                />
            </div>
            <div>
                <EngagedChart/>
            </div>
        </Layout>
    );
}

