import React from 'react';
import { Badge } from './Badge';

interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
}

interface KanbanViewProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
}

export function KanbanView<T extends { id: string | number }>({ columns, renderCard }: KanbanViewProps<T>) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-medium text-sm text-foreground/80">{column.title}</h3>
            <Badge variant="default" className="text-xs">{column.items.length}</Badge>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1 custom-scrollbar">
            {column.items.map((item) => (
              <div key={item.id}>
                {renderCard(item)}
              </div>
            ))}
            {column.items.length === 0 && (
              <div className="p-4 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
