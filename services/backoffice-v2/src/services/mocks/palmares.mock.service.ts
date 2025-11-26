import { licences } from '@/mocks/licences.mocks'
import { palmaresData } from '@/mocks/palmares.mocks'
import type { LicenceType } from '@/types/licences'
import type { PalmaresData } from '@/types/palmares'

const delay = () => new Promise(resolve => setTimeout(resolve, 300))

export const mockPalmaresService = {
  searchLicences: async (query: string): Promise<LicenceType[]> => {
    await delay()
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()
    return licences.filter(
      l =>
        l.lastName.toLowerCase().includes(lowerQuery) ||
        l.firstName.toLowerCase().includes(lowerQuery) ||
        l.licenceNumber.toLowerCase().includes(lowerQuery)
    )
  },

  getPalmares: async (licenceId: string): Promise<PalmaresData | undefined> => {
    await delay()
    return palmaresData.get(licenceId)
  },
}
