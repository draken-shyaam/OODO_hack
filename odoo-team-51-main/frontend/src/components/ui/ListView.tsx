import React, { useState } from 'react';
import { Search, Plus, LayoutGrid, List as ListIcon, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface ListViewProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onNew?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  viewMode?: 'list' | 'kanban';
  onViewModeChange?: (mode: 'list' | 'kanban') => void;
  kanbanComponent?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function ListView<T extends { id: string | number }>({
  title,
  data,
  columns,
  onNew,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  viewMode = 'list',
  onViewModeChange,
  kanbanComponent,
  onRowClick
}: ListViewProps<T>) {
  // Collapsed by default, matching the wireframe's icon-only search button —
  // expands into an input inline rather than occupying a permanent toolbar row.
  const [searchOpen, setSearchOpen] = useState(false);

  const closeSearch = () => {
    setSearchOpen(false);
    onSearchChange?.('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNew && (
            <Button onClick={onNew} className="gap-2">
              <Plus className="w-4 h-4" /> New
            </Button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {searchOpen && (
            <div className="relative">
              <input
                autoFocus
                placeholder={searchPlaceholder}
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                className="w-56 pl-3 pr-7 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={closeSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              className={`p-1.5 rounded-md transition-colors ${searchOpen ? 'bg-card shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
            >
              <Search className="w-4 h-4" />
            </button>
            {onViewModeChange && kanbanComponent && (
              <>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onViewModeChange('kanban')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-card shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-foreground/60 font-medium border-b border-border">
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} className="px-6 py-3 whitespace-nowrap">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row) => (
                  <tr 
                    key={row.id} 
                    onClick={() => onRowClick?.(row)}
                    className="hover:bg-secondary transition-colors cursor-pointer"
                  >
                    {columns.map((col, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap">
                        {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-foreground/60">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        kanbanComponent
      )}
    </div>
  );
}
