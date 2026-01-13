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

export type PaginationParams = {
    offset?: number
    limit?: number
    search?: string
    orderBy?: string
    orderDirection?: 'ASC' | 'DESC'
}

export type PaginationMeta = {
    offset: number
    limit: number
    total: number
    hasMore: boolean
}

export type PaginatedResponse<T> = {
    data: T[]
    meta: PaginationMeta
}
