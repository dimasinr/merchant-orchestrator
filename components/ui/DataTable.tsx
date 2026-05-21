'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { EmptyState } from './EmptyState';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  isLoading = false,
  onRowClick
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {searchKey && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>
        )}

        {/* Column Visibility and Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto ml-auto">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer">
              <Eye size={13} />
              <span>Columns</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-zinc-200 rounded-lg p-2 shadow-lg hidden group-hover:block z-35 animate-in fade-in duration-100">
              <span className="block px-2 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1.5">
                Toggle Columns
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-50 text-[11px] text-zinc-600 hover:text-zinc-950 cursor-pointer font-medium select-none"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={(e) => column.toggleVisibility(!!e.target.checked)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500/20 bg-white w-3.5 h-3.5"
                      />
                      <span className="capitalize">{column.id.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-left text-xs text-zinc-600">
            {/* Table Head */}
            <thead className="bg-zinc-50/75 border-b border-zinc-200 text-zinc-500 font-bold select-none sticky top-0 z-10 backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-5 py-3 text-left font-bold tracking-wider uppercase text-[10px]">
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1.5 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-zinc-800 transition-all' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown size={12} />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-100 bg-transparent">
              {isLoading ? (
                skeletonRows.map((_, idx) => (
                  <tr key={idx} className="animate-pulse bg-zinc-50/50">
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-5 py-4">
                        <div className="h-4 bg-zinc-200 rounded w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={`hover:bg-zinc-50/50 transition-all ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    <EmptyState
                      title="No transactions found"
                      description="We couldn't find any matching transaction records for your current search criteria."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 text-zinc-500 text-xs py-2 font-medium">
        <span>
          Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1} ({table.getFilteredRowModel().rows.length} records)
        </span>

        {/* Nav Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-400 transition-all cursor-pointer"
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-400 transition-all cursor-pointer"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-400 transition-all cursor-pointer"
          >
            <ChevronRight size={13} />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-400 transition-all cursor-pointer"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
