# Design: Page des Épreuves (Competitions) v2

**Date:** 2026-01-19
**Statut:** Validé

## Objectif

Créer la page de liste des épreuves dans webapp-v2 en reprenant :
- Les règles de gestion de CompetitionChooser.tsx (v1)
- Les patterns de pagination/filtres/tri de LicencesPage.tsx (v2)

## Règles de gestion (issues de v1)

| Fonction | Comportement |
|----------|--------------|
| Édition | Bouton → `/competition/{id}` (écran dédié) |
| Duplication | Bouton → confirmation → API POST `/competitions/{id}/duplicate` |
| Suppression | Bouton → confirmation → API DELETE |
| Compteur | "Nombre d'épreuves: **N**" (toolbarLeft) |

## Structure des fichiers

```
webapp-v2/src/
├── api/competitions.api.ts
├── hooks/useCompetitions.ts
├── types/competitions.ts
├── components/data/CompetitionsTable.tsx
├── pages/CompetitionsPage.tsx
└── pages/CompetitionDetailPage.tsx

api-v2/src/competitions/
├── competitions.service.ts (modifier)
├── competitions.controller.ts (modifier)
└── dto/filter-competition.dto.ts (créer)
```

## Types TypeScript

```typescript
export type CompetitionType = {
  id: number;
  eventDate: string;
  name: string;
  zipCode: string;
  fede: 'FSGT' | 'FFTRI' | 'FFVELO' | 'UFOLEP' | 'NL';
  competitionType: 'ROUTE' | 'CX' | 'VTT';
  club?: { id: number; longName: string; shortName: string };
  races: string;
  dept?: string;
  engagementsCount: number;
  classementsCount: number;
};

export type CompetitionFilters = Partial<Record<keyof CompetitionType, string>>;

export type CompetitionAdvancedFilters = {
  fedes?: string[];
  competitionTypes?: string[];
  depts?: string[];
  displayPast?: boolean;
  displayFuture?: boolean;
  startDate?: string;
  endDate?: string;
};
```

## API Client

```typescript
export const competitionsApi = {
  getAll: (params: PaginationParams) => apiClient(`/competitions${buildQueryString(params)}`),
  getById: (id: number) => apiClient(`/competitions/${id}`),
  create: (data) => apiClient('/competitions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiClient(`/competitions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiClient(`/competitions/${id}`, { method: 'DELETE' }),
  duplicate: (id) => apiClient(`/competitions/${id}/duplicate`, { method: 'POST' }),
};
```

## Hook useCompetitions

Calqué sur `useLicences` :
- Gestion des paramètres URL (offset, limit, orderBy, orderDirection, filters)
- Fonctions: `goToPage`, `setLimit`, `setFilter`, `setSort`, `setAdvancedFilters`
- React Query avec `keepPreviousData`

## Layout de la page

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: "Épreuves"                                              │
├─────────────────────────────────────────────────────────────────┤
│ toolbarLeft                    │ toolbar (droite)               │
│ "Nombre d'épreuves: **42**"    │ [+ Créer épreuve]              │
├─────────────────────────────────────────────────────────────────┤
│ Panneau filtres avancés                                         │
│ ○ Passées  ○ À venir  ● Toutes  │ [Fédés ▼] [Types ▼] [Depts ▼]│
├─────────────────────────────────────────────────────────────────┤
│ CompetitionsDataTable                                           │
│ Colonnes: Edit, Duplicate, Eng., Class., Date, Nom, Lieu,      │
│           Club, Fédé, Type                                      │
│ Pagination serveur + filtres par colonne + tri                  │
└─────────────────────────────────────────────────────────────────┘
```

## Colonnes de la table

| Colonne | Triable | Filtrable | Notes |
|---------|---------|-----------|-------|
| Edit | - | - | Bouton icône |
| Duplicate | - | - | Bouton icône + confirmation |
| Engagements | - | - | Nombre |
| Classements | - | - | Nombre |
| Date | ✓ | - | DD/MM/YYYY, tri par défaut DESC |
| Nom | ✓ | ✓ | |
| Lieu | ✓ | ✓ | zipCode |
| Club | ✓ | ✓ | club.longName |
| Fédé | ✓ | ✓ | |
| Type | ✓ | ✓ | competitionType |

## Modifications Backend

### CompetitionsService

1. **Pagination offset/limit** (au lieu de page/limit)
2. **Compteurs via sous-requête** :
   - `engagementsCount`: COUNT des races liées
   - `classementsCount`: COUNT des races avec rankingScratch != null
3. **Filtres par colonne** : name, zipCode, fede, competitionType, dept
4. **Tri dynamique** : validOrderFields avec orderBy/orderDirection

### FilterCompetitionDto

```typescript
export class FilterCompetitionDto extends PaginationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() fede?: string;
  @IsOptional() @IsString() competitionType?: string;
  @IsOptional() @IsString() dept?: string;
  @IsOptional() @IsArray() fedes?: string[];
  @IsOptional() @IsArray() competitionTypes?: string[];
  @IsOptional() @IsArray() depts?: string[];
  @IsOptional() @IsBoolean() displayPast?: boolean;
  @IsOptional() @IsBoolean() displayFuture?: boolean;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
```

## Routes

```typescript
// App.tsx
<Route path="/competitions" element={<CompetitionsPage />} />
<Route path="/competition/new" element={<CompetitionDetailPage />} />
<Route path="/competition/:id" element={<CompetitionDetailPage />} />
```
