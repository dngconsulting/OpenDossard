import type {
  PaginatedPaymentsResponse,
  PaymentPaginationParams,
  PaymentsScope,
  RefreshPaymentStatusResponse,
} from '@/types/payments';

import { buildQueryString } from './_query-string';
import { apiClient } from './client';

function buildBasePath(scope: PaymentsScope): string {
  if (scope.kind === 'all') {return '/helloasso/payments/admin/all';}
  return `/helloasso/payments/admin/competition/${scope.competitionId}`;
}

export const paymentsApi = {
  list: (
    scope: PaymentsScope,
    params: PaymentPaginationParams = {},
  ): Promise<PaginatedPaymentsResponse> =>
    apiClient<PaginatedPaymentsResponse>(`${buildBasePath(scope)}${buildQueryString(params)}`),

  refreshStatus: (paymentId: number): Promise<RefreshPaymentStatusResponse> =>
    apiClient<RefreshPaymentStatusResponse>(
      `/helloasso/payments/admin/${paymentId}/refresh-status`,
      { method: 'POST' },
    ),
};
