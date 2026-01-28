import { Cell, Pie, PieChart } from 'recharts';

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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { CatevDistributionItem } from '@/types/dashboard';

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(320, 70%, 50%)',
  'hsl(160, 70%, 50%)',
  'hsl(60, 70%, 50%)',
];

type Props = {
  data: CatevDistributionItem[] | undefined;
  isLoading: boolean;
};

export function CatevDistributionChart({ data, isLoading }: Props) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return <ChartEmpty />;

  const chartConfig = Object.fromEntries(
    data.map((d, i) => [
      d.catev,
      { label: d.catev, color: COLORS[i % COLORS.length] },
    ]),
  ) satisfies ChartConfig;

  const chartData = data.map(d => ({ ...d, fill: chartConfig[d.catev]?.color }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par catégorie de valeur</CardTitle>
        <CardDescription>
          {data.reduce((s, d) => s + d.count, 0)} participations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="catev" />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="catev"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ catev, percent }) => `${catev} (${(percent * 100).toFixed(0)}%)`}
              labelLine
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.catev} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="catev" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par catégorie de valeur</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par catégorie de valeur</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-10">Aucune donnée pour les critères sélectionnés</p>
      </CardContent>
    </Card>
  );
}
