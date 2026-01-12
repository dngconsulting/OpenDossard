export type LicenceType = {
    id: string
    licenceNumber: string
    lastName: string
    firstName: string
    club: string
    gender: 'H' | 'F'
    state: string
    birthYear: number
    ageCategory: string
    category: string
    cxCategory: string
    federation: 'FSGT' | 'FFTRI' | 'FFVELO' | 'UFOLEP' | 'FFCYCLISME' | 'FFC'
    season: string
}
