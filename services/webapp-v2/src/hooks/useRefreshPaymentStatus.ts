import { useMutation, useQueryClient } from '@tanstack/react-query';

import { paymentsApi } from '@/api/payments.api';
import { paymentsKeys } from '@/hooks/usePayments';
import { PAYMENT_STATUS_META, type RefreshPaymentStatusResponse } from '@/types/payments';
import {
  showInfoToast,
  showSuccessToast,
  showWarningToast,
} from '@/utils/error-handler/error-handler';

/**
 * Mutation pour l'action admin "re-synchroniser depuis HelloAsso" sur un
 * paiement bloqué en `pending`. Appelle `POST /helloasso/payments/admin/:id/
 * refresh-status` côté backend, invalide la liste sur succès et notifie l'admin
 * du résultat via toast.
 *
 * Toast par outcome :
 *   - `transitioned`  → success ("Paiement #X mis à jour → Payé")
 *   - `still_pending` → warning ("Toujours en attente côté HelloAsso", avec
 *                       état HA brut pour aider au diagnostic)
 *   - `no_change`     → info ("Statut déjà à jour")
 */
export function useRefreshPaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation<RefreshPaymentStatusResponse, Error, number>({
    mutationFn: paymentId => paymentsApi.refreshStatus(paymentId),
    onSuccess: data => {
      const statusLabel = PAYMENT_STATUS_META[data.status].label;
      if (data.outcome === 'transitioned') {
        showSuccessToast(`Paiement #${data.id} mis à jour : ${statusLabel}`);
        queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
      } else if (data.outcome === 'still_pending') {
        showWarningToast(
          `Paiement #${data.id} toujours en attente côté HelloAsso${
            data.helloAssoState ? ` (state=${data.helloAssoState})` : ' (aucun paiement enregistré)'
          }. L'utilisateur n'a pas finalisé sur la mire.`,
        );
      } else {
        showInfoToast(`Paiement #${data.id} : statut déjà à jour (${statusLabel}).`);
        queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
      }
    },
  });
}
