import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { TopRiderItem } from '@/types/dashboard';

const chartConfig = {
  count: {
    label: 'Participations',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

type Props = {
  data: TopRiderItem[] | undefined;
  isLoading: boolean;
};

export function TopRidersChart({ data, isLoading }: Props) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return <ChartEmpty />;

  const chartData = data.map(d => ({
    ...d,
    displayName: `${d.firstName} ${d.name}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 50 coureurs les plus assidus</CardTitle>
        <CardDescription>
          Classement par nombre de participations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(400, chartData.length * 24) }}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="displayName"
              type="category"
              width={180}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_value, payload) => {
                    const item = payload?.[0]?.payload as TopRiderItem & { displayName: string } | undefined;
                    return item ? `${item.displayName} (${item.club || 'Sans club'})` : '';
                  }}
                />
              }
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 50 coureurs les plus assidus</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 50 coureurs les plus assidus</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-10">Aucune donnée pour les critères sélectionnés</p>
      </CardContent>
    </Card>
  );
}
