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
import type { RidersPerCompetitionItem } from '@/types/dashboard';

const chartConfig = {
  count: {
    label: 'Coureurs',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

type Props = {
  data: RidersPerCompetitionItem[] | undefined;
  isLoading: boolean;
};

export function RidersPerCompetitionChart({ data, isLoading }: Props) {
  if (isLoading) return <ChartSkeleton title="Nombre de coureurs par épreuve" />;
  if (!data?.length) return <ChartEmpty title="Nombre de coureurs par épreuve" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nombre de coureurs par épreuve</CardTitle>
        <CardDescription>
          {data.length} épreuves &middot; {data.reduce((s, d) => s + d.count, 0)} participations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(400, data.length * 28) }}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
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

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-10">Aucune donnée pour les critères sélectionnés</p>
      </CardContent>
    </Card>
  );
}
