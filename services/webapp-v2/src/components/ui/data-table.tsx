'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnResizeMode,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  GripVertical,
  Search,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFilter,
  TableFilterCell,
  TableFilterRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PaginationMeta } from '@/types/licences';

interface ServerPaginationProps {
  enabled: true;
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  currentPage: number;
  totalPages: number;
}

interface NoPaginationProps {
  enabled?: false;
}

type PaginationProps = ServerPaginationProps | NoPaginationProps;

interface SortingProps {
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  onSortChange?: (column: string, direction: 'ASC' | 'DESC') => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onEditRow?: (row: TData) => void;
  onDeleteRow?: (row: TData) => void;
  onOpenRow?: (row: TData) => void;
  isLoading?: boolean;
  enableDragDrop?: boolean;
  onRowReorder?: (reorderedData: TData[]) => void;
  rowIdAccessor?: keyof TData;
  pagination?: PaginationProps;
  serverFilters?: Record<string, string>;
  onFilterChange?: (columnId: string, value: string) => void;
  sorting?: SortingProps;
  showColumnFilters?: boolean;
  renderBeforeRow?: (row: TData, index: number) => React.ReactNode | null;
}

interface SortableRowProps<TData> {
  row: Row<TData>;
  onEditRow?: (row: TData) => void;
  onDeleteRow?: (row: TData) => void;
  onOpenRow?: (row: TData) => void;
  enableDragDrop?: boolean;
  rowId: string;
}

function SortableRow<TData>({
  row,
  onEditRow,
  onDeleteRow,
  onOpenRow,
  enableDragDrop,
  rowId,
}: SortableRowProps<TData>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} data-state={row.getIsSelected() && 'selected'}>
      {enableDragDrop && (
        <TableCell className="w-8">
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
      {onOpenRow && (
        <TableCell style={{ width: 40 }}>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onOpenRow(row.original)}
            title="Palmarès"
          >
            <Trophy />
          </Button>
        </TableCell>
      )}
      {onEditRow && (
        <TableCell style={{ width: 40 }}>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onEditRow(row.original)}
            title="Éditer"
          >
            <Edit2 />
          </Button>
        </TableCell>
      )}
      {row.getVisibleCells().map(cell => {
        const hasFixedSize = cell.column.columnDef.size !== undefined;
        return (
          <TableCell
            key={cell.id}
            style={hasFixedSize ? { width: cell.column.getSize() } : undefined}
          >
            <div className="truncate">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </TableCell>
        );
      })}
      {onDeleteRow && (
        <TableCell style={{ width: 40 }}>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onDeleteRow(row.original)}
            title="Supprimer"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onEditRow,
  onDeleteRow,
  onOpenRow,
  isLoading,
  enableDragDrop = false,
  onRowReorder,
  rowIdAccessor = 'id' as keyof TData,
  pagination,
  serverFilters,
  onFilterChange,
  sorting,
  showColumnFilters = true,
  renderBeforeRow,
}: DataTableProps<TData, TValue>) {
  const isServerFiltering = !!onFilterChange;
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalData, setInternalData] = React.useState<TData[]>(data);
  const [localFilters, setLocalFilters] = React.useState<Record<string, string>>({});
  const debounceTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const serverFiltersKey = serverFilters ? JSON.stringify(serverFilters) : '';

  // Sync internal data when external data changes
  React.useEffect(() => {
    setInternalData(data);
  }, [data]);

  // Sync local filters with server filters (stable key avoids spurious resets)
  React.useEffect(() => {
    if (serverFilters) {
      setLocalFilters(serverFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFiltersKey]);

  const tableData = enableDragDrop ? internalData : data;
  const columnResizeMode: ColumnResizeMode = 'onChange';

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    ...(isServerFiltering ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    state: {
      columnFilters: isServerFiltering ? [] : columnFilters,
    },
    columnResizeMode,
    enableColumnResizing: true,
  });

  const handleFilterChange = React.useCallback((columnId: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [columnId]: value }));

    // Clear existing timer for this column
    if (debounceTimers.current[columnId]) {
      clearTimeout(debounceTimers.current[columnId]);
    }
    // Set new debounced call
    debounceTimers.current[columnId] = setTimeout(() => {
      onFilterChange?.(columnId, value);
    }, 500);
  }, [onFilterChange]);

  const handleSortChange = React.useCallback(
    (columnId: string) => {
      if (!sorting?.onSortChange) {
        return;
      }

      // Toggle direction: none -> ASC -> DESC -> ASC
      if (sorting.sortColumn === columnId) {
        const newDirection = sorting.sortDirection === 'ASC' ? 'DESC' : 'ASC';
        sorting.onSortChange(columnId, newDirection);
      } else {
        sorting.onSortChange(columnId, 'ASC');
      }
    },
    [sorting],
  );

  const getSortIcon = (columnId: string) => {
    if (!sorting?.onSortChange) {
      return null;
    }

    if (sorting.sortColumn === columnId) {
      return sorting.sortDirection === 'ASC' ? (
        <ArrowUp className="ml-1 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-1 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const getRowId = React.useCallback(
    (row: TData): string => {
      const id = row[rowIdAccessor];
      return String(id);
    },
    [rowIdAccessor],
  );

  const tableRows = table.getRowModel().rows;
  const rowIds = React.useMemo(
    () => tableRows.map(row => getRowId(row.original)),
    [tableRows, getRowId],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rowIds.indexOf(String(active.id));
      const newIndex = rowIds.indexOf(String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedData = arrayMove([...internalData], oldIndex, newIndex);
        setInternalData(reorderedData);
        onRowReorder?.(reorderedData);
      }
    }
  };

  const tableContent = (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-muted">
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {enableDragDrop && <TableHead className="w-8" />}
            {onOpenRow && <TableHead style={{ width: 40 }} />}
            {onEditRow && <TableHead style={{ width: 40 }} />}
            {headerGroup.headers.map(header => {
              const columnId = header.column.id;
              const isSortable = sorting?.onSortChange && !header.isPlaceholder;
              const hasFixedSize = header.column.columnDef.size !== undefined;
              return (
                <TableHead
                  key={header.id}
                  className={`relative group ${isSortable ? 'cursor-pointer select-none hover:bg-primary/20' : ''}`}
                  style={hasFixedSize ? { width: header.getSize() } : undefined}
                  onClick={isSortable ? () => handleSortChange(columnId) : undefined}
                >
                  <div className="flex items-center pr-1">
                    <span className="truncate">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {isSortable && getSortIcon(columnId)}
                  </div>
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    onClick={e => e.stopPropagation()}
                    className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none
                      ${header.column.getIsResizing() ? 'bg-primary' : 'bg-transparent group-hover:bg-border'}`}
                  />
                </TableHead>
              );
            })}
            {onDeleteRow && <TableHead style={{ width: 40 }} />}
          </TableRow>
        ))}
      </TableHeader>
      {showColumnFilters && (
        <TableFilter className="sticky top-8 z-10 bg-muted/50">
          {table.getHeaderGroups().map(headerGroup => (
            <TableFilterRow key={headerGroup.id}>
              {enableDragDrop && <TableFilterCell className="w-8" />}
              {onOpenRow && <TableFilterCell style={{ width: 40 }} />}
              {onEditRow && <TableFilterCell style={{ width: 40 }} />}
              {headerGroup.headers.map(header => {
                const columnId = header.column.id;
                const hasFixedSize = header.column.columnDef.size !== undefined;
                const canFilter = header.column.columnDef.enableColumnFilter !== false;
                const showClear = canFilter && (!hasFixedSize || header.getSize() >= 80);
                const filterValue = canFilter
                  ? isServerFiltering
                    ? localFilters[columnId] || ''
                    : header.column.getFilterValue()?.toString() || ''
                  : '';
                return (
                  <TableFilterCell
                    key={header.id}
                    style={hasFixedSize ? { width: header.getSize() } : undefined}
                  >
                    {canFilter ? (
                      <div className="relative">
                        {!filterValue && (
                          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                        )}
                        <Input
                          placeholder={columnId === 'club' ? 'Ex: Castan\u00e9en' : ''}
                          value={filterValue}
                          onChange={event => {
                            if (isServerFiltering) {
                              handleFilterChange(columnId, event.target.value);
                            } else {
                              header.column.setFilterValue(event.target.value);
                            }
                          }}
                          className={`h-8 text-sm text-left ${filterValue ? 'pl-2' : 'pl-6'} ${showClear ? 'pr-7' : ''} bg-background/80 border-border/50 focus:border-primary/50 ${columnId === 'club' ? 'placeholder:italic' : ''}`}
                        />
                        {showClear && filterValue && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isServerFiltering) {
                                handleFilterChange(columnId, '');
                              } else {
                                header.column.setFilterValue('');
                              }
                            }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ) : null}
                  </TableFilterCell>
                );
              })}
              {onDeleteRow && <TableFilterCell style={{ width: 40 }} />}
            </TableFilterRow>
          ))}
        </TableFilter>
      )}
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row, index) => (
            <React.Fragment key={row.id}>
              {renderBeforeRow?.(row.original, index)}
              <SortableRow
                row={row}
                rowId={getRowId(row.original)}
                onEditRow={onEditRow}
                onDeleteRow={onDeleteRow}
                onOpenRow={onOpenRow}
                enableDragDrop={enableDragDrop}
              />
            </React.Fragment>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length + (enableDragDrop ? 1 : 0)}
              className="h-24 text-center"
            >
              {isLoading ? 'Chargement...' : 'Aucun résultat'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const paginationControls = pagination?.enabled && (
    <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden md:inline">Lignes par page</span>
        <Select
          value={String(pagination.meta.limit)}
          onValueChange={value => pagination.onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map(size => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <span className="hidden md:inline text-sm text-muted-foreground">
          {pagination.meta.offset + 1}-
          {Math.min(pagination.meta.offset + pagination.meta.limit, pagination.meta.total)} sur{' '}
          {pagination.meta.total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => pagination.onPageChange(0)}
            disabled={pagination.currentPage === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="hidden md:inline text-sm px-2">
            Page {pagination.currentPage + 1} / {pagination.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.meta.hasMore}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => pagination.onPageChange(pagination.totalPages - 1)}
            disabled={!pagination.meta.hasMore}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-md border shadow-xs flex flex-col max-h-[calc(100vh-200px)]">
      <div className="overflow-auto flex-1">
        {enableDragDrop ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              {tableContent}
            </SortableContext>
          </DndContext>
        ) : (
          tableContent
        )}
      </div>
      {paginationControls}
    </div>
  );
}
