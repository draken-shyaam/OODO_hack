import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import { KanbanView } from '../../components/ui/KanbanView';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types';
import { listPurchaseOrders } from '../../api/purchaseApi';
import { useSocketEvent } from '../../hooks/useSocket';

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft', confirmed: 'Confirmed', partially_received: 'Partially Received',
  fully_received: 'Fully Received', cancelled: 'Cancelled',
};

export function PurchaseOrderList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? undefined;

  const refresh = () => listPurchaseOrders({ status: statusFilter, search: search || undefined }).then(setOrders).catch(console.error);

  useEffect(() => {
    const debounce = setTimeout(refresh, 300);
    return () => clearTimeout(debounce);
  }, [statusFilter, search]);
  useSocketEvent<{ orderType: string }>('order:status_changed', (p) => { if (p.orderType === 'purchase_order') refresh(); });

  const columns = [
    { header: 'Reference', accessor: 'reference' as keyof PurchaseOrder },
    { header: 'Vendor', accessor: (row: PurchaseOrder) => row.vendor?.name ?? '' },
    { header: 'Responsible', accessor: (row: PurchaseOrder) => row.responsiblePerson?.name ?? '' },
    {
      header: 'Status',
      accessor: (row: PurchaseOrder) => (
        <Badge variant={
          row.status === 'confirmed' ? 'info' :
          row.status === 'fully_received' ? 'success' :
          row.status === 'partially_received' ? 'warning' : 'default'
        }>
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
  ];

  const kanbanColumns = (Object.keys(STATUS_LABEL) as PurchaseOrderStatus[]).map((status) => ({
    id: status,
    title: STATUS_LABEL[status],
    items: orders.filter((o) => o.status === status),
  }));

  const renderKanbanCard = (order: PurchaseOrder) => (
    <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/purchase/${order.id}`)}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm">{order.reference}</span>
        <Badge variant="default" className="text-[10px]">{STATUS_LABEL[order.status]}</Badge>
      </div>
      <p className="text-sm text-foreground/70">{order.vendor?.name}</p>
    </Card>
  );

  return (
    <ListView
      title="Purchase Orders"
      data={orders}
      columns={columns}
      onNew={() => navigate('/purchase/new')}
      searchPlaceholder="Search by reference..."
      searchValue={search}
      onSearchChange={setSearch}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onRowClick={(row) => navigate(`/purchase/${row.id}`)}
      kanbanComponent={<KanbanView columns={kanbanColumns} renderCard={renderKanbanCard} />}
    />
  );
}
