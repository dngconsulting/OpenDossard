export type RaceType = {
    id: string
    engagedCount: number
    date: string
    name: string
    zip: string
    club: string
    categories: string[]
    federation: 'FSGT' | 'FFTRI' | 'FFVELO' | 'UFOLEP' | 'FFCYCLISME' | 'FFC'
    podiumGPS?: string
}
