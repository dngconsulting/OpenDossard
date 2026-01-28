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
import type { ClubParticipationItem } from '@/types/dashboard';

const chartConfig = {
  count: {
    label: 'Participations',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

type Props = {
  data: ClubParticipationItem[] | undefined;
  isLoading: boolean;
};

export function ClubParticipationChart({ data, isLoading }: Props) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return <ChartEmpty />;

  const top20 = data.slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participation des clubs</CardTitle>
        <CardDescription>
          Top {top20.length} clubs sur {data.length} &middot; Nombre de participations par club
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(400, top20.length * 32) }}>
          <BarChart data={top20} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="club"
              type="category"
              width={200}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
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
        <CardTitle>Participation des clubs</CardTitle>
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
        <CardTitle>Participation des clubs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-10">Aucune donnée pour les critères sélectionnés</p>
      </CardContent>
    </Card>
  );
}
