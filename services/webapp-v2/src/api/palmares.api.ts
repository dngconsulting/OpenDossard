import type { PalmaresData } from '@/types/palmares';
import { apiClient } from './client';

export const palmaresApi = {
  getPalmares: (licenceId: number): Promise<PalmaresData> =>
    apiClient<PalmaresData>(`/races/palmares/${licenceId}`),
};
