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
import { Edit2, GripVertical, Trash2, Trophy } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
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
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && 'selected'}
    >
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
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onEditRow(row.original)}
          >
            <Edit2 />
          </Button>
        </TableCell>
      )}
      {onDeleteRow && (
        <TableCell className="w-8">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onDeleteRow(row.original)}
          >
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
}: DataTableProps<TData, TValue> & { filterKey?: string }) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalData, setInternalData] = React.useState<TData[]>(data);

  // Sync internal data when external data changes
  React.useEffect(() => {
    setInternalData(data);
  }, [data]);

  const tableData = enableDragDrop ? internalData : data;

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

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
            {enableDragDrop && <TableFilterCell />}
            {headerGroup.headers.map(header => {
              return (
                <TableFilterCell key={header.id}>
                  <Input
                    placeholder={header.column.columnDef.header?.toString()}
                    value={header.column.getFilterValue()?.toString()}
                    onChange={event => header.column.setFilterValue(event.target.value)}
                  />
                </TableFilterCell>
              );
            })}
          </TableFilterRow>
        ))}
      </TableFilter>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(row => (
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
    </div>
  );
}
