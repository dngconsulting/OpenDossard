import { useMemo } from 'react';
import { Cell, Pie, PieChart, Label } from 'recharts';

import {
  Card,
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
import { CollapsibleChartCard } from './CollapsibleChartCard';
import type { CateaDistributionItem } from '@/types/dashboard';

// Theme-derived palette: primary blue, teal, green + harmonious variations
const COLORS = [
  '#4472C4',          // primary blue
  '#14B8A6',          // teal
  '#10B981',          // accent green
  '#5B8DEF',          // primary light
  '#2DD4BF',          // teal light
  '#34D399',          // green light
  '#2d4889',          // primary dark
  '#0D9488',          // teal dark
  '#059669',          // green dark
  '#f59e0b',          // chart-4 amber (contrast)
  '#8b5cf6',          // chart-5 violet (contrast)
  '#6366f1',          // indigo (complement)
];

const MAX_SLICES = 10;

type Props = {
  data: CateaDistributionItem[] | undefined;
  isLoading: boolean;
};

export function CateaDistributionChart({ data, isLoading }: Props) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return <ChartEmpty />;

  const { chartData, chartConfig, total, sortedAll } = useMemo(() => {
    const total = data.reduce((s, d) => s + d.count, 0);
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, MAX_SLICES);
    const rest = sorted.slice(MAX_SLICES);
    const othersCount = rest.reduce((s, d) => s + d.count, 0);

    const slices = [
      ...top.map((d, i) => ({ catea: d.catea, count: d.count, fill: COLORS[i % COLORS.length] })),
      ...(othersCount > 0 ? [{ catea: 'Autres', count: othersCount, fill: 'hsl(0, 0%, 70%)' }] : []),
    ];

    const config = Object.fromEntries(
      slices.map(d => [d.catea, { label: d.catea, color: d.fill }]),
    ) satisfies ChartConfig;

    return { chartData: slices, chartConfig: config, total, sortedAll: sorted };
  }, [data]);

  return (
    <CollapsibleChartCard
      header={
        <>
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-[var(--primary)] to-[var(--teal)]" />
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Répartition par catégorie d'âge</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              <span className="font-semibold text-foreground">{total.toLocaleString('fr-FR')}</span> participations
              {' '}&middot; <span className="font-semibold text-foreground">{data.length}</span> catégories
            </CardDescription>
          </div>
        </>
      }
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Donut */}
        <ChartContainer config={chartConfig} className="aspect-square w-full max-w-[260px] shrink-0">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="catea" />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="catea"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
              stroke="hsl(var(--background))"
              paddingAngle={1}
            >
              {chartData.map((entry) => (
                <Cell key={entry.catea} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-foreground text-2xl font-bold">
                          {total.toLocaleString('fr-FR')}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-[10px]">
                          participations
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Ranked list */}
        <div className="w-full max-h-[280px] overflow-y-auto pr-1">
          <div className="space-y-1">
            {sortedAll.map((item, i) => {
              const pct = ((item.count / total) * 100).toFixed(1);
              const color = i < MAX_SLICES ? COLORS[i % COLORS.length] : 'hsl(0, 0%, 70%)';
              return (
                <div key={item.catea} className="flex items-center gap-2 text-xs group">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate flex-1 text-foreground/80 group-hover:text-foreground font-medium">{item.catea}</span>
                  <span className="tabular-nums font-semibold text-foreground shrink-0">{item.count.toLocaleString('fr-FR')}</span>
                  <span className="tabular-nums text-muted-foreground shrink-0 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CollapsibleChartCard>
  );
}

function ChartSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Répartition par catégorie d'âge</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Répartition par catégorie d'âge</CardTitle>
      </CardHeader>
    </Card>
  );
}
