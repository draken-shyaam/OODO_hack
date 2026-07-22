import { useEffect, useState } from 'react';
import { ListView } from '../../components/ui/ListView';
import { useNavigate } from 'react-router-dom';
import type { SalesOrder } from '../../types';
import { listMyOrders } from '../../api/portalApi';

export function CustomerOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    listMyOrders().then(setOrders).catch(console.error);
  }, []);

  const columns = [
    { header: 'Order Ref', accessor: 'reference' as keyof SalesOrder },
    { header: 'Status', accessor: (row: SalesOrder) => row.status.replace(/_/g, ' ') },
    { header: 'Lines', accessor: (row: SalesOrder) => row.lines.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ListView title="My Orders" data={orders} columns={columns} viewMode="list" onRowClick={(row) => navigate(`/portal/orders/${row.id}`)} />
    </div>
  );
}
