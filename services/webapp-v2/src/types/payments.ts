import type { PaginatedResponse } from './pagination';

export type PaymentStatus = 'pending' | 'paid' | 'refused' | 'refunding' | 'refunded';

/**
 * Résumé d'un paiement HelloAsso pour affichage compact (badge dans listes,
 * card licence, etc.). Sous-ensemble des champs utiles à l'identification du
 * statut et du montant, sans les identifiants HelloAsso ni infos payeur.
 *
 * Réutilisé par : `LicenceType.helloAssoPayment` (autocomplete + card engagement).
 */
export type PaymentSummary = {
  status: PaymentStatus;
  tarifId: string;
  amount: number;
};

/**
 * Métadonnées d'affichage par statut : libellé FR + classes Tailwind pour
 * badges fill (background coloré) et badges outline (bordure colorée).
 * Source unique de vérité — utilisée par `PaymentSummaryBadge` (outline) et
 * `StatusBadge` dans `PaymentsTable` (fill). Si tu renommes "Refusé" → "Annulé",
 * change ici, c'est propagé partout.
 */
export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; fillClassName: string; outlineClassName: string }
> = {
  pending: {
    label: 'En attente',
    fillClassName: 'bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200',
    outlineClassName: 'border-amber-500 text-amber-700 dark:text-amber-400',
  },
  paid: {
    label: 'Payé',
    fillClassName: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border-emerald-200',
    outlineClassName: 'border-emerald-500 text-emerald-700 dark:text-emerald-400',
  },
  refused: {
    label: 'Refusé',
    fillClassName: 'bg-rose-100 text-rose-900 hover:bg-rose-100 border-rose-200',
    outlineClassName: 'border-rose-500 text-rose-700 dark:text-rose-400',
  },
  refunding: {
    label: 'Remb. en cours',
    fillClassName: 'bg-violet-100 text-violet-900 hover:bg-violet-100 border-violet-200',
    outlineClassName: 'border-violet-500 text-violet-700 dark:text-violet-400',
  },
  refunded: {
    label: 'Remboursé',
    fillClassName: 'bg-sky-100 text-sky-900 hover:bg-sky-100 border-sky-200',
    outlineClassName: 'border-sky-500 text-sky-700 dark:text-sky-400',
  },
};

/**
 * Vue admin/orga d'un paiement HelloAsso (endpoints `/helloasso/payments/admin/*`).
 *
 * Mirroir typé du DTO `PaymentAdminRowDto` côté api-v2. **Ne PAS** utiliser pour
 * l'écran "Mes paiements" mobile : celui-ci passe par `HelloAssoPaymentDto`
 * (vue restreinte sans `payerUserId`, `checkoutIntentId`, etc.).
 */
export type PaymentAdminRow = {
  id: number;
  status: PaymentStatus;
  // Compétition (JOIN)
  competitionId: number;
  competitionName: string | null;
  competitionDate: string | null;
  // Licencié (JOIN)
  licenceId: number;
  licenceName: string | null;
  licenceFirstName: string | null;
  club: string | null;
  gender: string | null;
  dept: string | null;
  birthYear: string | null;
  catea: string | null;
  catev: string | null;
  fede: string | null;
  // Race (JOIN, peut être null)
  riderNumber: number | null;
  raceCode: string | null;
  // Payeur
  payerUserId: number | null;
  payerFirstName: string | null;
  payerLastName: string | null;
  // Identifiants HelloAsso
  checkoutIntentId: string | null;
  orderId: string | null;
  paymentId: string | null;
  // Tarif / montant
  tarifId: string;
  amount: number;
  // Dates ISO 8601
  createdAt: string;
  paidAt: string | null;
};

export type PaymentFilters = {
  competitionName?: string;
  competitionDate?: string;
  riderNumber?: string;
  licenceName?: string;
  club?: string;
  gender?: string;
  dept?: string;
  birthYear?: string;
  catea?: string;
  catev?: string;
  fede?: string;
  payerName?: string;
  checkoutIntentId?: string;
  orderId?: string;
  paymentId?: string;
  /** CSV de statuts (multi-select), ex: 'paid,pending'. */
  status?: string;
  tarifId?: string;
  amount?: string;
};

export type PaymentPaginationParams = {
  offset?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: PaymentFilters;
};

/**
 * Scope d'affichage du composant `PaymentsTable` et du hook `usePayments`.
 * - `all` → `GET /helloasso/payments/admin/all` (ADMIN only)
 * - `competition` → `GET /helloasso/payments/admin/competition/:id`
 */
export type PaymentsScope = { kind: 'all' } | { kind: 'competition'; competitionId: number };

/**
 * Aggregate par statut pour la grille admin : montant total + nombre de
 * paiements. Réagit aux filtres en cours (sauf pagination).
 */
export type PaymentsSummaryByStatus = Record<
  PaymentStatus,
  { amount: number; count: number }
>;

export type PaginatedPaymentsResponse = PaginatedResponse<PaymentAdminRow> & {
  summary: PaymentsSummaryByStatus;
};

/**
 * Réponse de `POST /helloasso/payments/admin/:id/refresh-status` (action admin
 * "re-synchroniser depuis HelloAsso"). Miroir typé du DTO
 * `RefreshPaymentStatusDto` côté api-v2.
 *
 * `outcome` :
 *  - `transitioned`  : le statut local a changé suite à l'appel HelloAsso
 *  - `confirmed`     : HelloAsso a été interrogé, état renvoyé matche le statut
 *                      local (ou transition non autorisée → statut courant inchangé)
 *  - `still_pending` : statut local `pending` et HelloAsso n'a pas d'état terminal
 */
export type RefreshPaymentStatusOutcome = 'transitioned' | 'confirmed' | 'still_pending';

export type RefreshPaymentStatusResponse = {
  id: number;
  status: PaymentStatus;
  paidAt: string | null;
  helloAssoState: string | null;
  outcome: RefreshPaymentStatusOutcome;
};
