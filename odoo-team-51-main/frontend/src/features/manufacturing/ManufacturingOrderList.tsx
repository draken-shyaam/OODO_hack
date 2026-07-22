import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import { KanbanView } from '../../components/ui/KanbanView';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { ManufacturingOrder, ManufacturingOrderStatus } from '../../types';
import { listManufacturingOrders } from '../../api/manufacturingApi';
import { useSocketEvent } from '../../hooks/useSocket';

const STATUS_LABEL: Record<ManufacturingOrderStatus, string> = {
  draft: 'Draft', confirmed: 'Confirmed', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled',
};

/** Quick client-side approximation: are all components currently on hand? */
function componentsAvailable(order: ManufacturingOrder): boolean {
  return order.components.every((c) => Number(c.product?.onHandQty ?? 0) >= Number(c.toConsumeQty));
}

export function ManufacturingOrderList() {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? undefined;

  const refresh = () => listManufacturingOrders({ status: statusFilter, search: search || undefined }).then(setOrders).catch(console.error);

  useEffect(() => {
    const debounce = setTimeout(refresh, 300);
    return () => clearTimeout(debounce);
  }, [statusFilter, search]);
  useSocketEvent<{ orderType: string }>('order:status_changed', (p) => { if (p.orderType === 'manufacturing_order') refresh(); });

  const columns = [
    { header: 'Reference', accessor: 'reference' as keyof ManufacturingOrder },
    { header: 'Finished Product', accessor: (row: ManufacturingOrder) => row.finishedProduct?.name ?? '' },
    { header: 'Quantity', accessor: 'quantity' as keyof ManufacturingOrder },
    {
      header: 'Component Status',
      accessor: (row: ManufacturingOrder) => (
        <span className={componentsAvailable(row) ? 'text-green-600' : 'text-red-600'}>
          {componentsAvailable(row) ? 'Available' : 'Not Available'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: ManufacturingOrder) => (
        <Badge variant={row.status === 'confirmed' ? 'info' : row.status === 'in_progress' ? 'warning' : row.status === 'done' ? 'success' : 'default'}>
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
  ];

  const kanbanColumns = (Object.keys(STATUS_LABEL) as ManufacturingOrderStatus[]).map((status) => ({
    id: status,
    title: STATUS_LABEL[status],
    items: orders.filter((o) => o.status === status),
  }));

  const renderKanbanCard = (order: ManufacturingOrder) => (
    <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/manufacturing/${order.id}`)}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm">{order.reference}</span>
        <Badge variant="default" className="text-[10px]">{STATUS_LABEL[order.status]}</Badge>
      </div>
      <p className="text-sm text-foreground/70">{order.finishedProduct?.name} ({order.quantity})</p>
    </Card>
  );

  return (
    <ListView
      title="Manufacturing Orders"
      data={orders}
      columns={columns}
      onNew={() => navigate('/manufacturing/new')}
      searchPlaceholder="Search by reference..."
      searchValue={search}
      onSearchChange={setSearch}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onRowClick={(row) => navigate(`/manufacturing/${row.id}`)}
      kanbanComponent={<KanbanView columns={kanbanColumns} renderCard={renderKanbanCard} />}
    />
  );
}
