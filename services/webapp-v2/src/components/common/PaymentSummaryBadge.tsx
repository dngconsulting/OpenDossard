import { Receipt } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PAYMENT_STATUS_META, type PaymentSummary } from '@/types/payments';

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

type Props = {
  payment: PaymentSummary;
  /** `compact`: badge plus dense pour les listes (autocomplete). Default `false`. */
  compact?: boolean;
};

/**
 * Badge récap d'un paiement HelloAsso : statut coloré + tarif + montant.
 * Réutilisé dans la card licencié (`EngagementForm`) et dans chaque ligne du
 * dropdown autocomplete (`LicenceAutocomplete > LicenceItem`).
 */
export function PaymentSummaryBadge({ payment, compact = false }: Props) {
  const style = PAYMENT_STATUS_META[payment.status];
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Receipt className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <Badge
        variant="outline"
        className={cn(
          'font-medium gap-1',
          compact ? 'text-[10px] px-1.5 py-0' : 'text-xs',
          style.outlineClassName,
        )}
      >
        <span>{style.label}</span>
        <span className="opacity-70">·</span>
        <span>{payment.tarifId}</span>
        <span className="opacity-70">·</span>
        <span>{EUR.format(payment.amount)}</span>
      </Badge>
    </span>
  );
}
