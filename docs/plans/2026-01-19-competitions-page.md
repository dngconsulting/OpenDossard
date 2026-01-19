# Competitions Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer la page de liste des épreuves (CompetitionsPage) avec pagination serveur, filtres par colonne, tri, et actions (édition, duplication).

**Architecture:** Pattern identique à LicencesPage - hook useCompetitions gère l'état URL, CompetitionsDataTable utilise le composant DataTable générique, API backend modifiée pour offset/limit et compteurs agrégés.

**Tech Stack:** React 19, TanStack Query, Zustand, Tailwind CSS, NestJS, TypeORM, PostgreSQL

---

## Task 1: Types TypeScript (Frontend)

**Files:**
- Create: `services/webapp-v2/src/types/competitions.ts`

**Step 1: Créer le fichier types**

```typescript
import type { PaginationMeta, PaginationParams } from './licences';

export type CompetitionType = {
  id: number;
  eventDate: string;
  name: string;
  zipCode: string;
  fede: string;
  competitionType: string;
  club?: {
    id: number;
    longName: string;
    shortName: string;
  };
  races: string;
  dept?: string;
  engagementsCount: number;
  classementsCount: number;
};

export type CompetitionFilters = Partial<Record<keyof CompetitionType, string>>;

export type CompetitionPaginationParams = PaginationParams & {
  filters?: CompetitionFilters;
  // Filtres avancés
  fedes?: string;
  competitionTypes?: string;
  depts?: string;
  displayPast?: string;
  displayFuture?: string;
  startDate?: string;
  endDate?: string;
};

export type PaginatedCompetitionResponse = {
  data: CompetitionType[];
  meta: PaginationMeta;
};
```

**Step 2: Vérifier la compilation**

Run: `cd services/webapp-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 3: Commit**

```bash
git add services/webapp-v2/src/types/competitions.ts
git commit -m "feat(webapp): add competition types"
```

---

## Task 2: API Client (Frontend)

**Files:**
- Create: `services/webapp-v2/src/api/competitions.api.ts`

**Step 1: Créer le client API**

```typescript
import type { CompetitionType, CompetitionPaginationParams, PaginatedCompetitionResponse } from '@/types/competitions';
import { apiClient } from './client';

const buildQueryString = (params: CompetitionPaginationParams): string => {
  const searchParams = new URLSearchParams();

  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection) searchParams.set('orderDirection', params.orderDirection);

  // Filtres par colonne
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }

  // Filtres avancés
  if (params.fedes) searchParams.set('fedes', params.fedes);
  if (params.competitionTypes) searchParams.set('competitionTypes', params.competitionTypes);
  if (params.depts) searchParams.set('depts', params.depts);
  if (params.displayPast) searchParams.set('displayPast', params.displayPast);
  if (params.displayFuture) searchParams.set('displayFuture', params.displayFuture);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const competitionsApi = {
  getAll: (params: CompetitionPaginationParams = {}): Promise<PaginatedCompetitionResponse> =>
    apiClient<PaginatedCompetitionResponse>(`/competitions${buildQueryString(params)}`),

  getById: (id: number): Promise<CompetitionType> =>
    apiClient<CompetitionType>(`/competitions/${id}`),

  create: (data: Partial<CompetitionType>): Promise<CompetitionType> =>
    apiClient<CompetitionType>('/competitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CompetitionType>): Promise<CompetitionType> =>
    apiClient<CompetitionType>(`/competitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(`/competitions/${id}`, {
      method: 'DELETE',
    }),

  duplicate: (id: number): Promise<CompetitionType> =>
    apiClient<CompetitionType>(`/competitions/${id}/duplicate`, {
      method: 'POST',
    }),
};
```

**Step 2: Vérifier la compilation**

Run: `cd services/webapp-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 3: Commit**

```bash
git add services/webapp-v2/src/api/competitions.api.ts
git commit -m "feat(webapp): add competitions API client"
```

---

## Task 3: Hook useCompetitions (Frontend)

**Files:**
- Create: `services/webapp-v2/src/hooks/useCompetitions.ts`

**Step 1: Créer le hook**

```typescript
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { competitionsApi } from '@/api/competitions.api';
import useUserStore from '@/store/UserStore';
import type { CompetitionType, CompetitionFilters, CompetitionPaginationParams } from '@/types/competitions';

export const competitionsKeys = {
  all: ['competitions'] as const,
  list: (params: CompetitionPaginationParams) => ['competitions', 'list', params] as const,
  detail: (id: number) => ['competitions', id] as const,
};

const FILTER_KEYS: (keyof CompetitionType)[] = [
  'id',
  'name',
  'zipCode',
  'fede',
  'competitionType',
  'dept',
];

const ADVANCED_FILTER_KEYS = ['fedes', 'competitionTypes', 'depts', 'displayPast', 'displayFuture', 'startDate', 'endDate'];

function parseUrlParams(searchParams: URLSearchParams): CompetitionPaginationParams {
  const offset = searchParams.get('offset');
  const limit = searchParams.get('limit');
  const search = searchParams.get('search');
  const orderBy = searchParams.get('orderBy');
  const orderDirection = searchParams.get('orderDirection') as 'ASC' | 'DESC' | null;

  const filters: CompetitionFilters = {};
  FILTER_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  });

  const params: CompetitionPaginationParams = {
    offset: offset ? parseInt(offset, 10) : 0,
    limit: limit ? parseInt(limit, 10) : 20,
    search: search || undefined,
    orderBy: orderBy || 'eventDate',
    orderDirection: orderDirection || 'DESC',
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  };

  // Parse advanced filters
  ADVANCED_FILTER_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) (params as any)[key] = value;
  });

  return params;
}

function buildUrlParams(params: CompetitionPaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.offset && params.offset > 0) searchParams.set('offset', String(params.offset));
  if (params.limit && params.limit !== 20) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy && params.orderBy !== 'eventDate') searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection && params.orderDirection !== 'DESC') searchParams.set('orderDirection', params.orderDirection);

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }

  // Advanced filters
  ADVANCED_FILTER_KEYS.forEach(key => {
    const value = (params as any)[key];
    if (value) searchParams.set(key, value);
  });

  return searchParams;
}

export function useCompetitions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  const params = useMemo(() => parseUrlParams(searchParams), [searchParams]);

  const updateParams = useCallback(
    (newParams: Partial<CompetitionPaginationParams>) => {
      const merged = { ...params, ...newParams };
      setSearchParams(buildUrlParams(merged), { replace: true });
    },
    [params, setSearchParams]
  );

  const query = useQuery({
    queryKey: competitionsKeys.list(params),
    queryFn: () => competitionsApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const setLimit = useCallback(
    (limit: number) => {
      updateParams({ offset: 0, limit });
    },
    [updateParams]
  );

  const setSearch = useCallback(
    (search: string) => {
      updateParams({ offset: 0, search: search || undefined });
    },
    [updateParams]
  );

  const setFilter = useCallback(
    (key: keyof CompetitionType, value: string) => {
      const newFilters = { ...params.filters, [key]: value || undefined };
      const cleanFilters = Object.fromEntries(
        Object.entries(newFilters).filter(([, v]) => v)
      ) as CompetitionFilters;
      updateParams({
        offset: 0,
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
      });
    },
    [params.filters, updateParams]
  );

  const goToPage = useCallback(
    (page: number) => {
      const limit = params.limit || 20;
      updateParams({ offset: page * limit });
    },
    [params.limit, updateParams]
  );

  const setSort = useCallback(
    (column: string, direction: 'ASC' | 'DESC') => {
      updateParams({ orderBy: column, orderDirection: direction });
    },
    [updateParams]
  );

  const setAdvancedFilters = useCallback(
    (filters: Partial<CompetitionPaginationParams>) => {
      updateParams({ offset: 0, ...filters });
    },
    [updateParams]
  );

  const currentPage = Math.floor((params.offset || 0) / (params.limit || 20));
  const totalPages = query.data ? Math.ceil(query.data.meta.total / (params.limit || 20)) : 0;

  return {
    ...query,
    params,
    setLimit,
    setSearch,
    setFilter,
    setSort,
    setAdvancedFilters,
    goToPage,
    currentPage,
    totalPages,
  };
}

export function useCompetition(id: number | undefined) {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: competitionsKeys.detail(id!),
    queryFn: () => competitionsApi.getById(id!),
    enabled: !!id && isAuthenticated,
  });
}

export function useDuplicateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => competitionsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => competitionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}
```

**Step 2: Vérifier la compilation**

Run: `cd services/webapp-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 3: Commit**

```bash
git add services/webapp-v2/src/hooks/useCompetitions.ts
git commit -m "feat(webapp): add useCompetitions hook with pagination and filters"
```

---

## Task 4: CompetitionsDataTable (Frontend)

**Files:**
- Create: `services/webapp-v2/src/components/data/CompetitionsTable.tsx`

**Step 1: Créer le composant table**

```typescript
import { Copy, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompetitions } from '@/hooks/useCompetitions';
import type { CompetitionType } from '@/types/competitions';

import type { ColumnDef } from '@tanstack/react-table';

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border shadow-xs">
      <div className="bg-primary/10 border-b">
        <div className="flex h-8 items-center gap-1 px-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="bg-muted/30 border-b">
        <div className="flex items-center gap-1 px-1 py-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-1 border-b px-1 py-1">
          {Array.from({ length: 10 }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
      <div className="flex items-center justify-between px-2 py-2 border-t">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

type CompetitionsTableProps = {
  onEdit?: (row: CompetitionType) => void;
  onDuplicate?: (row: CompetitionType) => void;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const CompetitionsDataTable = ({ onEdit, onDuplicate }: CompetitionsTableProps) => {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    error,
    goToPage,
    setLimit,
    setFilter,
    setSort,
    params,
    currentPage,
    totalPages,
  } = useCompetitions();

  const columns: ColumnDef<CompetitionType>[] = [
    {
      accessorKey: 'engagementsCount',
      header: 'Eng.',
      size: 60,
      cell: ({ row }) => (
        <span className="text-center block">{row.original.engagementsCount}</span>
      ),
    },
    {
      accessorKey: 'classementsCount',
      header: 'Class.',
      size: 60,
      cell: ({ row }) => (
        <span className="text-center block">{row.original.classementsCount}</span>
      ),
    },
    {
      accessorKey: 'eventDate',
      header: 'Date',
      size: 100,
      cell: ({ row }) => formatDate(row.original.eventDate),
    },
    {
      accessorKey: 'name',
      header: 'Nom',
      size: 200,
    },
    {
      accessorKey: 'zipCode',
      header: 'Lieu',
      size: 80,
    },
    {
      accessorKey: 'club',
      header: 'Club',
      size: 180,
      cell: ({ row }) => row.original.club?.longName || '-',
    },
    {
      accessorKey: 'fede',
      header: 'Fédé',
      size: 70,
    },
    {
      accessorKey: 'competitionType',
      header: 'Type',
      size: 70,
    },
  ];

  if (error) {
    return <div>Erreur lors du chargement des épreuves...</div>;
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  // Custom row actions with Edit and Duplicate buttons
  const renderRowActions = (row: CompetitionType) => (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(row);
        }}
        title="Modifier cette épreuve"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate?.(row);
        }}
        title="Dupliquer cette épreuve"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      onEditRow={onEdit}
      isLoading={isLoading}
      serverFilters={(params.filters as Record<string, string>) || {}}
      onFilterChange={(columnId, value) => setFilter(columnId as keyof CompetitionType, value)}
      sorting={{
        sortColumn: params.orderBy,
        sortDirection: params.orderDirection,
        onSortChange: setSort,
      }}
      pagination={
        data?.meta
          ? {
              enabled: true,
              meta: data.meta,
              onPageChange: goToPage,
              onPageSizeChange: setLimit,
              currentPage,
              totalPages,
            }
          : undefined
      }
    />
  );
};
```

**Step 2: Vérifier la compilation**

Run: `cd services/webapp-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 3: Commit**

```bash
git add services/webapp-v2/src/components/data/CompetitionsTable.tsx
git commit -m "feat(webapp): add CompetitionsDataTable component"
```

---

## Task 5: CompetitionsPage (Frontend)

**Files:**
- Create: `services/webapp-v2/src/pages/CompetitionsPage.tsx`

**Step 1: Créer la page**

```typescript
import { Copy, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CompetitionsDataTable } from '@/components/data/CompetitionsTable';
import { useCompetitions, useDuplicateCompetition } from '@/hooks/useCompetitions';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CompetitionType } from '@/types/competitions';

export default function CompetitionsPage() {
  const navigate = useNavigate();
  const [duplicateCompetition, setDuplicateCompetition] = useState<CompetitionType | undefined>(undefined);
  const { data } = useCompetitions();
  const { mutate: duplicate, isPending: isDuplicating } = useDuplicateCompetition();
  const totalCompetitions = data?.meta?.total ?? 0;

  const handleDuplicate = () => {
    if (!duplicateCompetition) return;

    duplicate(duplicateCompetition.id, {
      onSuccess: (newCompetition) => {
        toast.success(`Épreuve "${duplicateCompetition.name}" dupliquée avec succès`);
        setDuplicateCompetition(undefined);
        navigate(`/competition/${newCompetition.id}`);
      },
      onError: () => {
        toast.error(`Erreur lors de la duplication de l'épreuve`);
      },
    });
  };

  const DuplicateDialog = () => (
    <Dialog
      open={!!duplicateCompetition}
      onOpenChange={(open: boolean) => !open && setDuplicateCompetition(undefined)}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dupliquer une épreuve</DialogTitle>
          <DialogDescription>
            Voulez-vous dupliquer l'épreuve "{duplicateCompetition?.name}" ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDuplicateCompetition(undefined)}>
            Annuler
          </Button>
          <Button onClick={handleDuplicate} disabled={isDuplicating}>
            {isDuplicating ? 'Duplication...' : 'Dupliquer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const toolbarLeft = (
    <span className="text-sm text-muted-foreground">
      Nombre d'épreuves : <strong className="text-foreground">{totalCompetitions}</strong>
    </span>
  );

  const toolbar = (
    <>
      <Button variant="success" onClick={() => navigate('/competition/new')}>
        <Plus /> Créer une épreuve
      </Button>
      <DuplicateDialog />
    </>
  );

  return (
    <Layout title="Épreuves" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <CompetitionsDataTable
        onEdit={(row: CompetitionType) => navigate(`/competition/${row.id}`)}
        onDuplicate={(row: CompetitionType) => setDuplicateCompetition(row)}
      />
    </Layout>
  );
}
```

**Step 2: Vérifier la compilation**

Run: `cd services/webapp-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 3: Commit**

```bash
git add services/webapp-v2/src/pages/CompetitionsPage.tsx
git commit -m "feat(webapp): add CompetitionsPage with duplicate functionality"
```

---

## Task 6: Routes (Frontend)

**Files:**
- Modify: `services/webapp-v2/src/App.tsx`

**Step 1: Lire le fichier App.tsx actuel**

Run: `cat services/webapp-v2/src/App.tsx`

**Step 2: Ajouter les imports et routes**

Ajouter en haut du fichier avec les autres imports lazy :
```typescript
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage'));
```

Ajouter dans les routes protégées (après `/licences`) :
```typescript
<Route path="/competitions" element={<CompetitionsPage />} />
<Route path="/competition/new" element={<CompetitionsPage />} />
<Route path="/competition/:id" element={<CompetitionsPage />} />
```

**Step 3: Vérifier la compilation**

Run: `cd services/webapp-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 4: Commit**

```bash
git add services/webapp-v2/src/App.tsx
git commit -m "feat(webapp): add competition routes"
```

---

## Task 7: Sidebar Navigation (Frontend)

**Files:**
- Modify: `services/webapp-v2/src/components/layout/AppSidebar.tsx`

**Step 1: Lire le fichier actuel**

Run: `cat services/webapp-v2/src/components/layout/AppSidebar.tsx`

**Step 2: Ajouter le lien Épreuves dans le menu**

Ajouter l'icône en import :
```typescript
import { Calendar } from 'lucide-react';
```

Ajouter dans la liste des items de navigation (après Licences) :
```typescript
{
  title: 'Épreuves',
  url: '/competitions',
  icon: Calendar,
},
```

**Step 3: Vérifier la compilation**

Run: `cd services/webapp-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 4: Commit**

```bash
git add services/webapp-v2/src/components/layout/AppSidebar.tsx
git commit -m "feat(webapp): add competitions link to sidebar"
```

---

## Task 8: Backend - FilterCompetitionDto

**Files:**
- Create: `services/api-v2/src/competitions/dto/filter-competition.dto.ts`
- Modify: `services/api-v2/src/competitions/competitions.service.ts`

**Step 1: Créer le DTO**

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto';

export class FilterCompetitionDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by name (partial match)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by zip code (partial match)' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Filter by federation (partial match)' })
  @IsOptional()
  @IsString()
  fede?: string;

  @ApiPropertyOptional({ description: 'Filter by competition type (partial match)' })
  @IsOptional()
  @IsString()
  competitionType?: string;

  @ApiPropertyOptional({ description: 'Filter by department (partial match)' })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple federations (comma-separated)' })
  @IsOptional()
  @IsString()
  fedes?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple competition types (comma-separated)' })
  @IsOptional()
  @IsString()
  competitionTypes?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple departments (comma-separated)' })
  @IsOptional()
  @IsString()
  depts?: string;

  @ApiPropertyOptional({ description: 'Show past competitions' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  displayPast?: boolean;

  @ApiPropertyOptional({ description: 'Show future competitions' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  displayFuture?: boolean;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

**Step 2: Commit**

```bash
git add services/api-v2/src/competitions/dto/filter-competition.dto.ts
git commit -m "feat(api): add FilterCompetitionDto"
```

---

## Task 9: Backend - CompetitionsService avec compteurs

**Files:**
- Modify: `services/api-v2/src/competitions/competitions.service.ts`

**Step 1: Remplacer le service complet**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CompetitionEntity } from './entities/competition.entity';
import { PaginatedResponseDto } from '../common/dto';
import { FilterCompetitionDto } from './dto/filter-competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private competitionRepository: Repository<CompetitionEntity>,
  ) {}

  async findAll(
    filterDto: FilterCompetitionDto,
  ): Promise<PaginatedResponseDto<CompetitionEntity & { engagementsCount: number; classementsCount: number }>> {
    const {
      offset = 0,
      limit = 20,
      search,
      orderBy = 'eventDate',
      orderDirection = 'DESC',
      name,
      zipCode,
      fede,
      competitionType,
      dept,
      fedes,
      competitionTypes,
      depts,
      displayPast,
      displayFuture,
      startDate,
      endDate,
    } = filterDto;

    const queryBuilder = this.competitionRepository
      .createQueryBuilder('competition')
      .leftJoinAndSelect('competition.club', 'club')
      // Sous-requête pour compter les engagements
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('race', 'r')
            .where('r.competition_id = competition.id'),
        'engagementsCount',
      )
      // Sous-requête pour compter les classements (avec ranking_scratch non null)
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('race', 'r')
            .where('r.competition_id = competition.id')
            .andWhere('r.ranking_scratch IS NOT NULL'),
        'classementsCount',
      );

    // Global search
    if (search) {
      queryBuilder.andWhere(
        '(competition.name ILIKE :search OR competition.zipCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Column filters
    if (name) {
      queryBuilder.andWhere('competition.name ILIKE :name', { name: `%${name}%` });
    }
    if (zipCode) {
      queryBuilder.andWhere('competition.zipCode ILIKE :zipCode', { zipCode: `%${zipCode}%` });
    }
    if (fede) {
      queryBuilder.andWhere('competition.fede::text ILIKE :fede', { fede: `%${fede}%` });
    }
    if (competitionType) {
      queryBuilder.andWhere('competition.competitionType::text ILIKE :competitionType', {
        competitionType: `%${competitionType}%`,
      });
    }
    if (dept) {
      queryBuilder.andWhere('competition.dept ILIKE :dept', { dept: `%${dept}%` });
    }

    // Advanced filters - multiple values
    if (fedes) {
      const fedesArray = fedes.split(',');
      queryBuilder.andWhere('competition.fede IN (:...fedesArray)', { fedesArray });
    }
    if (competitionTypes) {
      const typesArray = competitionTypes.split(',');
      queryBuilder.andWhere('competition.competitionType IN (:...typesArray)', { typesArray });
    }
    if (depts) {
      const deptsArray = depts.split(',');
      queryBuilder.andWhere('competition.dept IN (:...deptsArray)', { deptsArray });
    }

    // Date filters
    const now = new Date();
    if (displayPast === true && displayFuture === false) {
      queryBuilder.andWhere('competition.eventDate < :now', { now });
    } else if (displayFuture === true && displayPast === false) {
      queryBuilder.andWhere('competition.eventDate >= :now', { now });
    }

    if (startDate) {
      queryBuilder.andWhere('competition.eventDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('competition.eventDate <= :endDate', { endDate });
    }

    // Ordering
    const validOrderFields = ['eventDate', 'name', 'zipCode', 'fede', 'competitionType', 'dept'];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'eventDate';
    queryBuilder.orderBy(`competition.${orderField}`, orderDirection as 'ASC' | 'DESC');

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Pagination
    queryBuilder.skip(offset).take(limit);

    // Execute and map results
    const rawResults = await queryBuilder.getRawAndEntities();

    const data = rawResults.entities.map((entity, index) => ({
      ...entity,
      engagementsCount: parseInt(rawResults.raw[index]?.engagementsCount || '0', 10),
      classementsCount: parseInt(rawResults.raw[index]?.classementsCount || '0', 10),
    }));

    return new PaginatedResponseDto(data, total, offset, limit);
  }

  async findOne(id: number): Promise<CompetitionEntity> {
    const competition = await this.competitionRepository.findOne({
      where: { id },
      relations: ['club'],
    });
    if (!competition) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }
    return competition;
  }

  async create(competitionData: Partial<CompetitionEntity>): Promise<CompetitionEntity> {
    const competition = this.competitionRepository.create(competitionData);
    return this.competitionRepository.save(competition);
  }

  async update(id: number, competitionData: Partial<CompetitionEntity>): Promise<CompetitionEntity> {
    const competition = await this.findOne(id);
    Object.assign(competition, competitionData);
    return this.competitionRepository.save(competition);
  }

  async remove(id: number): Promise<void> {
    const competition = await this.findOne(id);
    await this.competitionRepository.remove(competition);
  }

  async duplicate(id: number): Promise<CompetitionEntity> {
    const original = await this.findOne(id);
    const { id: _, ...competitionData } = original;
    const duplicate = this.competitionRepository.create({
      ...competitionData,
      name: `${original.name} (copie)`,
      resultsValidated: false,
    });
    return this.competitionRepository.save(duplicate);
  }

  async validate(id: number): Promise<CompetitionEntity> {
    const competition = await this.findOne(id);
    competition.resultsValidated = true;
    return this.competitionRepository.save(competition);
  }
}
```

**Step 2: Vérifier la compilation**

Run: `cd services/api-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 3: Commit**

```bash
git add services/api-v2/src/competitions/competitions.service.ts
git commit -m "feat(api): update CompetitionsService with offset/limit and counts"
```

---

## Task 10: Backend - Update Controller

**Files:**
- Modify: `services/api-v2/src/competitions/competitions.controller.ts`

**Step 1: Mettre à jour l'import**

Remplacer l'import de `CompetitionFilterDto` :
```typescript
import { CompetitionsService } from './competitions.service';
import { FilterCompetitionDto } from './dto/filter-competition.dto';
```

**Step 2: Mettre à jour la méthode findAll**

```typescript
@Get()
@Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
@ApiOperation({ summary: 'Get all competitions with filters' })
@ApiResponse({ status: 200, description: 'Paginated list of competitions' })
async findAll(
  @Query() filterDto: FilterCompetitionDto,
): Promise<PaginatedResponseDto<CompetitionEntity>> {
  return this.competitionsService.findAll(filterDto);
}
```

**Step 3: Créer le fichier index pour les DTOs**

Créer `services/api-v2/src/competitions/dto/index.ts` :
```typescript
export * from './filter-competition.dto';
```

**Step 4: Vérifier la compilation**

Run: `cd services/api-v2 && npx tsc --noEmit`
Expected: Aucune erreur

**Step 5: Commit**

```bash
git add services/api-v2/src/competitions/
git commit -m "feat(api): update competitions controller with new FilterDto"
```

---

## Task 11: Test d'intégration

**Step 1: Démarrer les services**

Run: `./od.sh start`

**Step 2: Tester l'API**

Run: `curl -s http://localhost:3500/api/v2/competitions?limit=5 | jq '.data[0] | {id, name, engagementsCount, classementsCount}'`

Expected: Réponse JSON avec les compteurs

**Step 3: Tester le frontend**

1. Ouvrir http://localhost:5173
2. Se connecter
3. Cliquer sur "Épreuves" dans le menu
4. Vérifier : compteur affiché, table avec données, pagination fonctionnelle

**Step 4: Commit final**

```bash
git add -A
git commit -m "feat: complete competitions page implementation"
```
