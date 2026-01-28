'use client';

import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  CardAction,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CollapsibleChartCard } from './CollapsibleChartCard';
import type { EngagementChartData } from '@/types/dashboard';

const chartConfig = {
  fsgt: {
    label: 'Engagés',
    color: 'var(--primary)',
  },
  ffc: {
    label: 'Engagés',
    color: 'var(--accent-green)',
  },
  ufolep: {
    label: 'Engagés',
    color: 'var(--teal)',
  },
} satisfies ChartConfig;

type EngagedChartProps = {
  data: EngagementChartData[];
};

export function EngagedChart({ data: chartData }: EngagedChartProps) {
  const [fede, setFede] = useState('fsgt');

  return (
    <CollapsibleChartCard
      className="@container/card"
      header={
        <>
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-[var(--primary)] to-[var(--accent-green)]" />
          <div className="flex-1">
            <CardTitle className="text-lg font-bold tracking-tight">Engagés</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Engagés toutes catégories confondues par discipline et par semaine
            </CardDescription>
          </div>
          <CardAction>
            <ToggleGroup
              type="single"
              value={fede}
              onValueChange={setFede}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="fsgt">FSGT</ToggleGroupItem>
              <ToggleGroupItem value="ffc">FFC</ToggleGroupItem>
              <ToggleGroupItem value="ufolep">UFOLEP</ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </>
      }
    >
      <div className="px-0 sm:px-2">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillEngaged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`var(--color-${fede})`} stopOpacity={0.6} />
                <stop offset="100%" stopColor={`var(--color-${fede})`} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 11 }}
              tickFormatter={value => value}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={value => `Semaine ${value}`}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={fede}
              type="natural"
              fillOpacity={1}
              fill="url(#fillEngaged)"
              stroke={`var(--color-${fede})`}
              strokeWidth={2.5}
              stackId="engaged"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </CollapsibleChartCard>
  );
}
