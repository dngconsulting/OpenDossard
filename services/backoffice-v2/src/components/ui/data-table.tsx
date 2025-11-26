'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit2, Trash2, Trophy } from 'lucide-react';
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onEditRow,
  onDeleteRow,
  onOpenRow,
  isLoading,
}: DataTableProps<TData, TValue> & { filterKey?: string }) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  return (
    <div className="overflow-hidden rounded-md border shadow-xs">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
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
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {isLoading ? 'Loading...' : 'No Results.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
