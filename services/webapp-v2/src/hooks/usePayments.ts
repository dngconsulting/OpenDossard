import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { paymentsApi } from '@/api/payments.api';
import useUserStore from '@/store/UserStore';
import type {
  PaymentFilters,
  PaymentPaginationParams,
  PaymentsScope,
} from '@/types/payments';

/**
 * Hook lazy pour les grids de paiements admin/orga. Calqué sur `useLicences` :
 * pagination + tri + filtres côté serveur, état persisté dans les query params
 * URL pour refresh-safe.
 *
 * Différences avec `useLicences` :
 *  - paramétré par `PaymentsScope` (all vs competition)
 *  - pas de `search` global (filtrage par colonne uniquement, demande métier)
 *  - tri par défaut côté serveur (`paid_at DESC, created_at DESC`) — on n'envoie
 *    pas de `orderBy` par défaut, le backend applique sa default.
 */
const FILTER_KEYS: (keyof PaymentFilters)[] = [
  'competitionName',
  'competitionDate',
  'riderNumber',
  'licenceName',
  'club',
  'gender',
  'dept',
  'birthYear',
  'catea',
  'catev',
  'fede',
  'payerName',
  'checkoutIntentId',
  'orderId',
  'paymentId',
  'status',
  'tarifId',
  'amount',
];

function scopeKey(scope: PaymentsScope): string {
  return scope.kind === 'all' ? 'all' : `competition-${scope.competitionId}`;
}

export const paymentsKeys = {
  all: ['payments'] as const,
  list: (scope: PaymentsScope, params: PaymentPaginationParams) =>
    ['payments', scopeKey(scope), params] as const,
};

function parseUrlParams(searchParams: URLSearchParams): PaymentPaginationParams {
  const offset = searchParams.get('offset');
  const limit = searchParams.get('limit');
  const orderBy = searchParams.get('orderBy');
  const orderDirection = searchParams.get('orderDirection') as 'ASC' | 'DESC' | null;

  const filters: PaymentFilters = {};
  FILTER_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      (filters as Record<string, string>)[key] = value;
    }
  });

  return {
    offset: offset ? parseInt(offset, 10) : 0,
    limit: limit ? parseInt(limit, 10) : 20,
    orderBy: orderBy || undefined,
    orderDirection: orderDirection || undefined,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  };
}

function buildUrlParams(params: PaymentPaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (params.offset && params.offset > 0) {searchParams.set('offset', String(params.offset));}
  if (params.limit && params.limit !== 20) {searchParams.set('limit', String(params.limit));}
  if (params.orderBy) {searchParams.set('orderBy', params.orderBy);}
  if (params.orderDirection) {searchParams.set('orderDirection', params.orderDirection);}
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) {searchParams.set(key, String(value));}
    });
  }
  return searchParams;
}

/**
 * Hook léger : "y a-t-il AU MOINS un paiement pour ce scope ?".
 * Utilisé par `EngagementsPage` pour conditionner l'affichage de l'onglet
 * Paiements (cf. design 2026-05-17 §3.a). Fait UN appel `limit=1` sans
 * filtres et sans interagir avec les URL params — pour éviter toute
 * collision avec ceux portés par `usePayments` quand le tab est actif.
 *
 * Retour : `hasAny` = `true` dès que `meta.total > 0`. `isLoading` distingué
 * pour éviter le flash "tab apparaît puis disparaît" au boot.
 */
export function usePaymentsHasAny(scope: PaymentsScope | null) {
  const isAuthenticated = useUserStore(s => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['payments', 'has-any', scope ? scopeKey(scope) : 'disabled'] as const,
    // `scope!` safe : `enabled` ci-dessous garantit que la queryFn n'est pas
    // appelée tant que scope est null.
    queryFn: () => paymentsApi.list(scope!, { offset: 0, limit: 1 }),
    enabled: isAuthenticated && scope !== null,
    staleTime: 30_000,
    // `keepPreviousData` évite que `hasAny` repasse à `false` pendant un
    // refetch déclenché par `invalidateQueries(['payments'])` — sinon le tab
    // HelloAsso clignote (disparaît puis réapparaît) côté EngagementsPage.
    placeholderData: keepPreviousData,
  });

  return {
    hasAny: (query.data?.meta?.total ?? 0) > 0,
    isLoading: query.isLoading,
  };
}

export function usePayments(scope: PaymentsScope) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useUserStore(s => s.isAuthenticated);

  const params = useMemo(() => parseUrlParams(searchParams), [searchParams]);

  const updateParams = useCallback(
    (newParams: Partial<PaymentPaginationParams>) => {
      const merged = { ...params, ...newParams };
      const next = buildUrlParams(merged);
      // Ce hook est partagé par deux écrans :
      //  - « Historique des paiements » (`PaymentsHistoryPage`, scope `all`) :
      //    page autonome, AUCUN hash → on utilise le pattern standard
      //    `setSearchParams`, identique à `useLicences` (fiable, sans effet
      //    de bord). C'est le cas par défaut.
      //  - onglet HelloAsso d'`EngagementsPage` (scope `competition`) : la
      //    course / l'onglet actif est porté par `#payments` / `#<raceCode>`.
      //    Or `setSearchParams` strip le hash en interne. UNIQUEMENT dans ce
      //    cas (hash présent) on passe par `navigate` pour le préserver.
      if (location.hash) {
        const q = next.toString();
        navigate(
          { search: q ? `?${q}` : '', hash: location.hash },
          { replace: true },
        );
      } else {
        setSearchParams(next, { replace: true });
      }
    },
    [params, navigate, setSearchParams, location.hash],
  );

  const query = useQuery({
    queryKey: paymentsKeys.list(scope, params),
    queryFn: () => paymentsApi.list(scope, params),
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const setLimit = useCallback(
    (limit: number) => updateParams({ offset: 0, limit }),
    [updateParams],
  );

  const setFilter = useCallback(
    (key: keyof PaymentFilters, value: string) => {
      const newFilters = { ...params.filters, [key]: value || undefined };
      const cleanFilters = Object.fromEntries(
        Object.entries(newFilters).filter(([, v]) => v),
      ) as PaymentFilters;
      updateParams({
        offset: 0,
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
      });
    },
    [params.filters, updateParams],
  );

  const goToPage = useCallback(
    (page: number) => {
      const limit = params.limit || 20;
      updateParams({ offset: page * limit });
    },
    [params.limit, updateParams],
  );

  const setSort = useCallback(
    (column: string, direction: 'ASC' | 'DESC') => {
      updateParams({ orderBy: column, orderDirection: direction });
    },
    [updateParams],
  );

  const currentPage = Math.floor((params.offset || 0) / (params.limit || 20));
  const totalPages = query.data ? Math.ceil(query.data.meta.total / (params.limit || 20)) : 0;

  return {
    ...query,
    params,
    setLimit,
    setFilter,
    setSort,
    goToPage,
    currentPage,
    totalPages,
  };
}
