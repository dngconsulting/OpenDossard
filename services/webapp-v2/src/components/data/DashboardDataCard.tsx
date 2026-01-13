import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  data: string;
  description: string;
  subDescription: string;
  tag?: ReactNode;
};

export function DashboardDataCard({ title, data, description, subDescription, tag }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {data}
        </CardTitle>
        <CardAction>{tag && tag}</CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">{description}</div>
        <div className="text-muted-foreground">{subDescription}</div>
      </CardFooter>
    </Card>
  );
}
