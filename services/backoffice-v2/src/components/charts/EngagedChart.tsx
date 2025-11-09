'use client';

import {useState} from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"


import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {useEngagementChart} from '@/hooks/useCharts'

const chartConfig = {
    fsgt: {
        label: 'Engagés',
        color: 'var(--chart-1)',
    },
    ffc: {
        label: 'Engagés',
        color: 'var(--chart-1)',
    },
    ufolep: {
        label: 'Engagés',
        color: 'var(--chart-1)',
    }
} satisfies ChartConfig;

export function EngagedChart() {
    const [fede, setFede] = useState('fsgt');
    const { data: chartData, isLoading, error } = useEngagementChart();

    if (isLoading) {return <div>Loading...</div>;}
    if (error) {return <div>Error loading chart data</div>;}
    if (!chartData) {return null;}

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>Engagés</CardTitle>
                <CardDescription>
                    Engagés toutes catégories confondues par discipline et par semaine
                </CardDescription>
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
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="fillEngaged" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor={`var(--color-${fede})`}
                                    stopOpacity={1.0}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={`var(--color-${fede})`}
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false}/>
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                return value
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return `Semaine ${value}`
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey={fede}
                            type="natural"
                            fillOpacity={0.4}
                            fill="url(#fillEngaged)"
                            stroke={`var(--color-${fede})`}
                            stackId="engaged"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
