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
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  GripVertical,
  Trash2,
  Trophy,
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
      {row.getVisibleCells().map(cell => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
      {onEditRow && (
        <TableCell className="w-8">
          <Button variant="outline" size="icon-sm" onClick={() => onEditRow(row.original)}>
            <Edit2 />
          </Button>
        </TableCell>
      )}
      {onDeleteRow && (
        <TableCell className="w-8">
          <Button variant="outline" size="icon-sm" onClick={() => onDeleteRow(row.original)}>
            <Trash2 />
          </Button>
        </TableCell>
      )}
      {onOpenRow && (
        <TableCell className="w-8">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onOpenRow(row.original)}
            title="Voir le palmarès"
          >
            <Trophy />
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
}: DataTableProps<TData, TValue>) {
  const isServerFiltering = !!onFilterChange;
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalData, setInternalData] = React.useState<TData[]>(data);
  const [localFilters, setLocalFilters] = React.useState<Record<string, string>>({});
  const debounceTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sync internal data when external data changes
  React.useEffect(() => {
    setInternalData(data);
  }, [data]);

  // Sync local filters with server filters
  React.useEffect(() => {
    if (serverFilters) {
      setLocalFilters(serverFilters);
    }
  }, [serverFilters]);

  const tableData = enableDragDrop ? internalData : data;

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    ...(isServerFiltering ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    state: {
      columnFilters: isServerFiltering ? [] : columnFilters,
    },
  });

  const handleFilterChange = React.useCallback(
    (columnId: string, value: string) => {
      setLocalFilters(prev => ({ ...prev, [columnId]: value }));

      if (onFilterChange) {
        // Clear existing timer for this column
        if (debounceTimers.current[columnId]) {
          clearTimeout(debounceTimers.current[columnId]);
        }
        // Set new debounced call
        debounceTimers.current[columnId] = setTimeout(() => {
          onFilterChange(columnId, value);
        }, 400);
      }
    },
    [onFilterChange]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getRowId = React.useCallback(
    (row: TData): string => {
      const id = row[rowIdAccessor];
      return String(id);
    },
    [rowIdAccessor]
  );

  const tableRows = table.getRowModel().rows;
  const rowIds = React.useMemo(
    () => tableRows.map(row => getRowId(row.original)),
    [tableRows, getRowId]
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
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {enableDragDrop && <TableHead className="w-8" />}
            {headerGroup.headers.map(header => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
            {onEditRow && <TableHead />}
            {onDeleteRow && <TableHead />}
            {onOpenRow && <TableHead />}
          </TableRow>
        ))}
      </TableHeader>
      <TableFilter>
        {table.getHeaderGroups().map(headerGroup => (
          <TableFilterRow key={headerGroup.id}>
            {enableDragDrop && <TableFilterCell className="w-8" />}
            {headerGroup.headers.map(header => {
              const columnId = header.column.id;
              return (
                <TableFilterCell key={header.id}>
                  <Input
                    placeholder={columnId === 'club' ? 'Ex: Castanéen' : ''}
                    value={
                      isServerFiltering
                        ? localFilters[columnId] || ''
                        : header.column.getFilterValue()?.toString() || ''
                    }
                    onChange={event => {
                      if (isServerFiltering) {
                        handleFilterChange(columnId, event.target.value);
                      } else {
                        header.column.setFilterValue(event.target.value);
                      }
                    }}
                    className={`h-8 text-sm text-left bg-background/80 border-border/50 focus:border-primary/50 ${columnId === 'club' ? 'placeholder:italic' : ''}`}
                  />
                </TableFilterCell>
              );
            })}
            {onEditRow && <TableFilterCell className="w-8" />}
            {onDeleteRow && <TableFilterCell className="w-8" />}
            {onOpenRow && <TableFilterCell className="w-8" />}
          </TableFilterRow>
        ))}
      </TableFilter>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map(row => (
              <SortableRow
                key={row.id}
                row={row}
                rowId={getRowId(row.original)}
                onEditRow={onEditRow}
                onDeleteRow={onDeleteRow}
                onOpenRow={onOpenRow}
                enableDragDrop={enableDragDrop}
              />
            ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length + (enableDragDrop ? 1 : 0)}
              className="h-24 text-center"
            >
              {isLoading ? 'Loading...' : 'No Results.'}
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
    <div className="overflow-hidden rounded-md border shadow-xs">
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
      {paginationControls}
    </div>
  );
}
