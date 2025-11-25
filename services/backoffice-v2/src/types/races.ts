export type RaceCategory = {
    id: string
    name: string
    startTime: string
    registerTime: string
    gpx: string
    laps?: number
    totalDistance: number
}

export type RaceType = {
    id: string
    engagedCount: number
    date: string
    name: string
    zip: string
    club: string
    categories: RaceCategory[]
    federation: 'FSGT' | 'FFTRI' | 'FFVELO' | 'UFOLEP' | 'FFCYCLISME' | 'FFC'
    podiumGPS?: string
}
