import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';

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
  defaultOpen?: boolean;
};

function truncateLabel(label: string, maxLen = 40): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + '\u2026';
}

export function ClubParticipationChart({ data, isLoading, defaultOpen }: Props) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return <ChartEmpty />;

  const top20 = data.slice(0, 20);
  const totalParticipations = data.reduce((s, d) => s + d.count, 0);

  return (
    <CollapsibleChartCard
      defaultOpen={defaultOpen}
      header={
        <>
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-[var(--accent-green)] to-[var(--teal)]" />
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Participation des clubs</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Top <span className="font-semibold text-foreground">{top20.length}</span> clubs sur{' '}
              <span className="font-semibold text-foreground">{data.length}</span> &middot;{' '}
              <span className="font-semibold text-foreground">{totalParticipations.toLocaleString('fr-FR')}</span> participations
            </CardDescription>
          </div>
        </>
      }
    >
      <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(400, top20.length * 32) }}>
        <BarChart data={top20} layout="vertical" margin={{ left: 10, right: 50 }}>
          <defs>
            <linearGradient id="gradClub" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.15} />
          <YAxis
            dataKey="club"
            type="category"
            width={320}
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={({ x, y, payload }) => (
              <text x={x} y={y} dy={4} textAnchor="end" className="fill-foreground text-xs font-medium">
                <title>{payload.value}</title>
                {truncateLabel(payload.value)}
              </text>
            )}
          />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="url(#gradClub)" radius={[0, 6, 6, 0]} barSize={18}>
            <LabelList dataKey="count" position="right" className="fill-muted-foreground text-xs font-semibold" />
          </Bar>
        </BarChart>
      </ChartContainer>
      {data.length >= 100 && (
        <p className="text-xs text-muted-foreground text-center mt-2">Seuls les 100 premiers clubs sont affichés</p>
      )}
    </CollapsibleChartCard>
  );
}

function ChartSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Participation des clubs</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Participation des clubs</CardTitle>
      </CardHeader>
    </Card>
  );
}
