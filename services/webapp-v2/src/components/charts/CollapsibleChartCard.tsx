'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type Props = {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function CollapsibleChartCard({ header, children, defaultOpen = true, className = '' }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm ${className}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer select-none group">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 min-w-0">{header}</div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground ${open ? '' : '-rotate-90'}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-2">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
