import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { useIsMobile } from '@/hooks/useMediaQuery';

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
  defaultOpen?: boolean;
};

function truncateLabel(label: string, maxLen = 24): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + '\u2026';
}

export function TopRidersChart({ data, isLoading, defaultOpen }: Props) {
  const isMobile = useIsMobile();

  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return <ChartEmpty />;

  const chartData = data.map(d => ({
    ...d,
    displayName: `${d.firstName} ${d.name}`,
  }));
  const yAxisWidth = isMobile ? 140 : 200;
  const labelMaxLen = isMobile ? 16 : 24;

  return (
    <CollapsibleChartCard
      defaultOpen={defaultOpen}
      header={
        <>
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-[var(--teal)] to-[var(--primary)]" />
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Top {data.length} coureurs les plus assidus</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Classement par nombre de participations
            </CardDescription>
          </div>
        </>
      }
    >
      <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(400, chartData.length * 30) }}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 50 }} barGap={4}>
          <defs>
            <linearGradient id="gradTopRiders" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.15} />
          <YAxis
            dataKey="displayName"
            type="category"
            width={yAxisWidth}
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={({ x, y, payload }) => (
              <text x={x} y={y} dy={4} textAnchor="end" className="fill-foreground text-xs font-medium">
                <title>{payload.value}</title>
                {truncateLabel(payload.value, labelMaxLen)}
              </text>
            )}
          />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
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
          <Bar dataKey="count" fill="url(#gradTopRiders)" radius={[0, 6, 6, 0]} barSize={16}>
            <LabelList dataKey="count" position="right" className="fill-muted-foreground text-xs font-semibold" />
          </Bar>
        </BarChart>
      </ChartContainer>
      {data.length >= 50 && (
        <p className="text-xs text-muted-foreground text-center mt-2">Seuls les 50 premiers coureurs sont affichés</p>
      )}
    </CollapsibleChartCard>
  );
}

function ChartSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Top 50 coureurs les plus assidus</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Top 50 coureurs les plus assidus</CardTitle>
      </CardHeader>
    </Card>
  );
}
