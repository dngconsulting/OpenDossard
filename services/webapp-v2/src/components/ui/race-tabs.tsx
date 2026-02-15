import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const RACE_TABS_LIST_CLASS =
  'mb-0 flex w-full justify-start gap-0 rounded-t-xl rounded-b-none bg-muted/50 p-0 h-auto overflow-x-auto scrollbar-none border-0';

const RACE_TAB_TRIGGER_CLASS =
  'group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]';

export function RaceTabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList className={cn(RACE_TABS_LIST_CLASS, className)} {...props}>
      {children}
    </TabsList>
  );
}

export function RaceTabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger className={cn(RACE_TAB_TRIGGER_CLASS, className)} {...props}>
      {children}
    </TabsTrigger>
  );
}
