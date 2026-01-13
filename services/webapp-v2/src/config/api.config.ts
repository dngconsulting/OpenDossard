export type ApiMode = 'mock' | 'real'

export interface ApiConfig {
  licences: ApiMode
  races: ApiMode
  users: ApiMode
  challenges: ApiMode
  charts: ApiMode
  dashboard: ApiMode
  palmares: ApiMode
}

export const apiConfig: ApiConfig = {
  licences: 'real',
  races: 'mock',
  users: 'mock',
  challenges: 'mock',
  charts: 'mock',
  dashboard: 'mock',
  palmares: 'mock',
}

export const isMockMode = (entity: keyof ApiConfig): boolean => {
  return apiConfig[entity] === 'mock'
}
