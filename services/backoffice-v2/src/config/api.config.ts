export type ApiMode = 'mock' | 'real'

export interface ApiConfig {
  licences: ApiMode
  races: ApiMode
  users: ApiMode
  challenges: ApiMode
  charts: ApiMode
  dashboard: ApiMode
  palmares: ApiMode
  clubs: ApiMode
  departments: ApiMode
}

export const apiConfig: ApiConfig = {
  licences: 'mock',
  races: 'mock',
  users: 'mock',
  challenges: 'mock',
  charts: 'mock',
  dashboard: 'mock',
  palmares: 'mock',
  clubs: 'mock',
  departments: 'mock',
}

export const isMockMode = (entity: keyof ApiConfig): boolean => {
  return apiConfig[entity] === 'mock'
}
