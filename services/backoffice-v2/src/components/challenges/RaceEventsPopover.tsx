import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RaceEventsPopoverProps {
  events?: string[];
}

export function RaceEventsPopover({ events }: RaceEventsPopoverProps) {
  const defaultEvents = [
    'Épreuve 1',
    'Épreuve 2',
    'Épreuve 3',
    'Épreuve 4',
  ];

  const displayEvents = events || defaultEvents;

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline">
          Epreuves
          <Info height={20} width={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        Les épreuves concernées par le challenge printemps sont :
        <ul className="list-disc pl-4 mt-2">
          {displayEvents.map((event, index) => (
            <li key={index}>{event}</li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
