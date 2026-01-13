export type LicenceType = {
    id: number
    licenceNumber: string
    name: string
    firstName: string
    club: string
    gender: string
    dept: string
    birthYear: string
    catea: string
    catev: string
    catevCX: string
    fede: 'FSGT' | 'FFTRI' | 'FFVELO' | 'UFOLEP' | 'FFCYCLISME' | 'FFC' | 'NL'
    saison: string
    author?: string
    lastChanged?: string
    comment?: string
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
