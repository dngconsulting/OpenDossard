import { useQuery } from '@tanstack/react-query';

import { palmaresApi } from '@/api/palmares.api';

export const palmaresKeys = {
  detail: (licenceId: number) => ['palmares', licenceId] as const,
};

export function usePalmares(licenceId: number | undefined) {
  return useQuery({
    queryKey: palmaresKeys.detail(licenceId!),
    queryFn: () => palmaresApi.getPalmares(licenceId!),
    enabled: !!licenceId,
  });
}
