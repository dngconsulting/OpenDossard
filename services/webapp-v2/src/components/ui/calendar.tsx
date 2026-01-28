import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'react-day-picker/locale';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function Calendar({ className, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={fr}
      showOutsideDays
      startMonth={new Date(2000, 0)}
      endMonth={new Date(2035, 11)}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center text-sm font-medium',
        nav: 'flex items-center justify-between absolute inset-x-0 px-3',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 text-foreground hover:text-foreground cursor-pointer z-10',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 text-foreground hover:text-foreground cursor-pointer z-10',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        ),
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
        today: 'bg-accent text-accent-foreground rounded-md',
        outside: 'text-muted-foreground/50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
