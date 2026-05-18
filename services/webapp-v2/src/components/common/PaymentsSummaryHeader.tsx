import {
  PAYMENT_STATUS_META,
  type PaymentStatus,
  type PaymentsSummaryByStatus,
} from '@/types/payments';

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

/**
 * Header affiché au-dessus de la grille `PaymentsTable` : breakdown des
 * montants + comptes par statut, calculé côté backend sur la base des filtres
 * en cours (cf. `summary` dans `PaginatedPaymentsResponse`).
 *
 * Affichage compact, type "ticker" : `[Payé · 250,00 € (12)] [En attente · 20,00 € (1)] …`
 * Les statuts à 0 paiement sont masqués pour ne pas polluer.
 */
type Props = {
  summary: PaymentsSummaryByStatus;
};

const STATUS_ORDER: PaymentStatus[] = ['paid', 'pending', 'refused', 'refunded'];

export function PaymentsSummaryHeader({ summary }: Props) {
  const entries = STATUS_ORDER.map(status => ({
    status,
    meta: PAYMENT_STATUS_META[status],
    ...summary[status],
  })).filter(e => e.count > 0);

  if (entries.length === 0) {
    return (
      <div className="my-4 text-sm text-muted-foreground">Aucune transaction sur ce périmètre.</div>
    );
  }

  return (
    <div className="my-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <h3 className="text-lg font-bold text-foreground mr-1">Recette</h3>
      {entries.map(e => (
        <span
          key={e.status}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium ${e.meta.outlineClassName}`}
        >
          <span>{e.meta.label}</span>
          <span className="opacity-60">·</span>
          <span className="tabular-nums">{EUR.format(e.amount)}</span>
          <span className="opacity-60">·</span>
          <span className="tabular-nums">
            {e.count} paiement{e.count > 1 ? 's' : ''}
          </span>
        </span>
      ))}
    </div>
  );
}
