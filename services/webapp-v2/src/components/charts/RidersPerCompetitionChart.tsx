import { useRef } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { exportChartToPdf } from '@/utils/chart-pdf-export';
import { truncateLabel } from '@/utils/format';

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
  defaultOpen?: boolean;
};

export function RidersPerCompetitionChart({ data, isLoading, defaultOpen }: Props) {
  const isMobile = useIsMobile();
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = () => {
    if (chartRef.current) exportChartToPdf(chartRef.current, 'Nombre de coureurs par épreuve');
  };

  if (isLoading) return <ChartSkeleton title="Nombre de coureurs par épreuve" />;
  if (!data?.length) return <ChartEmpty title="Nombre de coureurs par épreuve" />;

  const total = data.reduce((s, d) => s + d.count, 0);
  const yAxisWidth = isMobile ? 180 : 320;
  const labelMaxLen = isMobile ? 22 : 40;

  return (
    <CollapsibleChartCard
      defaultOpen={defaultOpen}
      onExportPdf={handleExportPdf}
      header={
        <>
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-[var(--primary)] to-[var(--teal)]" />
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Nombre de coureurs par épreuve</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              <span className="font-semibold text-foreground">{data.length}</span> épreuves &middot;{' '}
              <span className="font-semibold text-foreground">{total.toLocaleString('fr-FR')}</span> participations
            </CardDescription>
          </div>
        </>
      }
    >
      <div ref={chartRef}>
      <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(400, data.length * 28) }}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50 }}>
          <defs>
            <linearGradient id="gradRiders" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.15} />
          <YAxis
            dataKey="name"
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
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload as RidersPerCompetitionItem | undefined;
                  if (!item) return '';
                  const date = new Date(item.eventDate).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });
                  return `${item.name} — ${date}`;
                }}
              />
            }
          />
          <Bar dataKey="count" fill="url(#gradRiders)" radius={[0, 6, 6, 0]} barSize={18}>
            <LabelList dataKey="count" position="right" className="fill-muted-foreground text-xs font-semibold" />
          </Bar>
        </BarChart>
      </ChartContainer>
      {data.length >= 100 && (
        <p className="text-xs text-muted-foreground text-center mt-2">Seules les 100 premières épreuves sont affichées</p>
      )}
      </div>
    </CollapsibleChartCard>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
    </Card>
  );
}
