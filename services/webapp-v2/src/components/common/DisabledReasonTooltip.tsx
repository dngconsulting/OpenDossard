import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { ReactElement } from 'react';


type DisabledReasonTooltipProps = {
  /** Raison de la désactivation ; `null` : pas d'infobulle. */
  reason: string | null;
  children: ReactElement;
};

/**
 * Explique au survol pourquoi un bouton est désactivé. Un bouton désactivé ne
 * reçoit pas le survol (pointer-events-none) : l'infobulle est portée par un
 * span englobant.
 */
export function DisabledReasonTooltip({ reason, children }: DisabledReasonTooltipProps) {
  if (!reason) {
    return children;
  }
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{children}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
