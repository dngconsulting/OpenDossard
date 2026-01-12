import type { LicenceType } from './licences'

export type CompetitionType = 'ROUTE' | 'CX'

export type RiderStats = {
  totalRaces: number
  wins: number
  podiums: number
  winRate: number
  avgRanking: number
  bestRanking: number
}

export type CategoryChange = {
  date: string
  season: string
  fromCategory: string | null
  toCategory: string
}

export type PalmaresRaceResult = {
  id: string
  competitionId: string
  date: string
  competitionName: string
  competitionType: CompetitionType
  category: string
  ranking: number
  totalParticipants?: number
}

export type PalmaresData = {
  licence: LicenceType
  stats: RiderStats
  categoryHistory: CategoryChange[]
  results: PalmaresRaceResult[]
}
