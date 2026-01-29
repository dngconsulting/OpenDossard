/**
 * Re-exports from the auto-generated OpenAPI types.
 * Run `pnpm generate:api` to regenerate from the backend Swagger spec.
 */
import type { components } from './api.generated';

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------
export type CompetitionEntity = components['schemas']['CompetitionEntity'];
export type LicenceEntity = components['schemas']['LicenceEntity'];
export type RaceEntity = components['schemas']['RaceEntity'];
export type ClubEntity = components['schemas']['ClubEntity'];
export type ChallengeEntity = components['schemas']['ChallengeEntity'];

// ---------------------------------------------------------------------------
// DTO types
// ---------------------------------------------------------------------------
export type RaceRowDto = components['schemas']['RaceRowDto'];
export type PalmaresRowDto = components['schemas']['PalmaresRowDto'];
export type CreateEngagementDto = components['schemas']['CreateEngagementDto'];
export type UpdateRankingDto = components['schemas']['UpdateRankingDto'];
export type RemoveRankingDto = components['schemas']['RemoveRankingDto'];
export type ReorderRankingItemDto = components['schemas']['ReorderRankingItemDto'];
export type CreateLicenceDto = components['schemas']['CreateLicenceDto'];
export type UpdateLicenceDto = components['schemas']['UpdateLicenceDto'];
export type ChallengeRiderDto = components['schemas']['ChallengeRiderDto'];
export type ChallengeRaceRowDto = components['schemas']['ChallengeRaceRowDto'];
export type LoginDto = components['schemas']['LoginDto'];
export type AuthResponseDto = components['schemas']['AuthResponseDto'];

// ---------------------------------------------------------------------------
// Enums extracted from the spec (runtime values + types)
// ---------------------------------------------------------------------------
export const FEDERATIONS = ['FSGT', 'UFOLEP', 'FFC', 'CYCLOS', 'FFVELO', 'NL', 'FFTRI'] as const;
export type Federation = CompetitionEntity['fede'];

export const COMPETITION_TYPES = ['CX', 'ROUTE', 'VTT'] as const;
export type CompetitionType = CompetitionEntity['competitionType'];

export const GENDERS = ['H', 'F'] as const;
export type Gender = (typeof GENDERS)[number];

// ---------------------------------------------------------------------------
// Label maps derived from enums
// ---------------------------------------------------------------------------
export const FEDERATION_LABELS: Record<Federation, string> = {
  FSGT: 'FSGT',
  UFOLEP: 'UFOLEP',
  FFC: 'FFC',
  CYCLOS: 'CYCLOS',
  FFVELO: 'FFVELO',
  NL: 'Non Licencié',
  FFTRI: 'FFTRI',
};

export const COMPETITION_TYPE_LABELS: Record<CompetitionType, string> = {
  CX: 'Cyclo-cross',
  ROUTE: 'Route',
  VTT: 'VTT',
};

export const GENDER_LABELS: Record<Gender, string> = {
  H: 'Homme',
  F: 'Femme',
};

// ---------------------------------------------------------------------------
// Select options derived from enums + labels
// ---------------------------------------------------------------------------
export const FEDERATION_OPTIONS = FEDERATIONS.map(f => ({ value: f, label: FEDERATION_LABELS[f] }));
export const COMPETITION_TYPE_OPTIONS = COMPETITION_TYPES.map(t => ({ value: t, label: COMPETITION_TYPE_LABELS[t] }));
export const GENDER_OPTIONS = GENDERS.map(g => ({ value: g, label: GENDER_LABELS[g] }));
