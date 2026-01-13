import { isMockMode } from '@/config/api.config';
import { mockPalmaresService } from '@/services/mocks/palmares.mock.service';
import type { LicenceType } from '@/types/licences';
import type { PalmaresData } from '@/types/palmares';

import { apiClient } from './client';

const realPalmaresService = {
  searchLicences: (query: string): Promise<LicenceType[]> =>
    apiClient<LicenceType[]>(`/licences/search?q=${encodeURIComponent(query)}`),

  getPalmares: (licenceId: string): Promise<PalmaresData> =>
    apiClient<PalmaresData>(`/palmares/${licenceId}`),
};

export const palmaresApi = isMockMode('palmares') ? mockPalmaresService : realPalmaresService;
