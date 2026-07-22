import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import { KanbanView } from '../../components/ui/KanbanView';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { SalesOrder, SalesOrderStatus } from '../../types';
import { listSalesOrders } from '../../api/salesApi';
import { useSocketEvent } from '../../hooks/useSocket';

const STATUS_LABEL: Record<SalesOrderStatus, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  partially_delivered: 'Partially Delivered',
  fully_delivered: 'Fully Delivered',
  cancelled: 'Cancelled',
};

/** "Tomorrow"/"Yesterday"/"Today" for adjacent days, otherwise a short date — matches the wireframe's list-view Date column. */
function formatRelativeDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(date) - startOfDay(today)) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function SalesOrderList() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? undefined;

  const refresh = () => listSalesOrders({ status: statusFilter, search: search || undefined }).then(setOrders).catch(console.error);

  useEffect(() => {
    const debounce = setTimeout(refresh, 300);
    return () => clearTimeout(debounce);
  }, [statusFilter, search]);
  useSocketEvent<{ orderType: string }>('order:status_changed', (p) => { if (p.orderType === 'sales_order') refresh(); });

  const columns = [
    { header: 'Reference', accessor: 'reference' as keyof SalesOrder },
    { header: 'Date', accessor: (row: SalesOrder) => formatRelativeDate(row.dueDate ?? row.createdAt) },
    { header: 'Customer', accessor: (row: SalesOrder) => row.customer?.name ?? '' },
    { header: 'Salesperson', accessor: (row: SalesOrder) => row.salesPerson?.name ?? '' },
    {
      header: 'Status',
      accessor: (row: SalesOrder) => (
        <Badge variant={
          row.status === 'confirmed' ? 'info' :
          row.status === 'fully_delivered' ? 'success' :
          row.status === 'partially_delivered' ? 'warning' : 'default'
        }>
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
  ];

  const kanbanColumns = (Object.keys(STATUS_LABEL) as SalesOrderStatus[]).map((status) => ({
    id: status,
    title: STATUS_LABEL[status],
    items: orders.filter((o) => o.status === status),
  }));

  const renderKanbanCard = (order: SalesOrder) => (
    <Card
      className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(`/sales/${order.id}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm">{order.reference}</span>
        <Badge variant="default" className="text-[10px]">{STATUS_LABEL[order.status]}</Badge>
      </div>
      <p className="text-sm text-foreground/70">{order.customer?.name}</p>
      <p className="text-xs text-foreground/50 mt-1">{formatRelativeDate(order.dueDate ?? order.createdAt)}</p>
    </Card>
  );

  return (
    <ListView
      title="Sales Orders"
      data={orders}
      columns={columns}
      onNew={() => navigate('/sales/new')}
      searchPlaceholder="Search by reference or customer..."
      searchValue={search}
      onSearchChange={setSearch}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onRowClick={(row) => navigate(`/sales/${row.id}`)}
      kanbanComponent={<KanbanView columns={kanbanColumns} renderCard={renderKanbanCard} />}
    />
  );
}
