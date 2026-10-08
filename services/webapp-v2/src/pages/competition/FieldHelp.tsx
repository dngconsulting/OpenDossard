import { CircleHelp } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type FieldHelpProps = {
  /** Explication affichée au survol ou au focus du « ? ». */
  children: string;
};

/** « ? » à côté du libellé d'un champ, qui explique son usage au survol. */
export function FieldHelp({ children }: FieldHelpProps) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={children}
          className="inline-flex align-middle text-muted-foreground hover:text-foreground"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{children}</TooltipContent>
    </Tooltip>
  );
}
