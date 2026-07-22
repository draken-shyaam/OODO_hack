import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { ShoppingBag, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SalesOrder } from '../../types';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { listMyOrders } from '../../api/portalApi';

const TERMINAL = new Set(['fully_delivered', 'cancelled']);

export function PortalDashboard() {
  const navigate = useNavigate();
  const { customer } = usePortalAuthStore();
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    listMyOrders().then(setOrders).catch(console.error);
  }, []);

  const activeOrders = orders.filter((o) => !TERMINAL.has(o.status));
  const deliverableForReview = orders.filter((o) => o.status === 'fully_delivered' || o.status === 'partially_delivered');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome, {customer?.name}</h1>
        <p className="text-foreground/60 mt-1">Here is the latest overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/portal/orders')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><ShoppingBag className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-foreground">Active Orders</h3>
              <p className="text-sm text-foreground/60">{activeOrders.length} currently in progress</p>
            </div>
          </div>
          <div className="text-sm text-blue-600 font-medium">View all orders &rarr;</div>
        </Card>

        <Card className="p-6 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/portal/reviews')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center"><Star className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-foreground">Reviewable Orders</h3>
              <p className="text-sm text-foreground/60">{deliverableForReview.length} delivered order(s) eligible</p>
            </div>
          </div>
          <div className="text-sm text-yellow-600 font-medium">Submit review &rarr;</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-foreground">Total Orders</h3>
              <p className="text-sm text-foreground/60">{orders.length} order(s) on this account</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4">Recent Orders</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary border-b border-border text-foreground/70 font-medium">
              <tr><th className="px-4 py-3">Order Ref</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-secondary cursor-pointer transition-colors" onClick={() => navigate(`/portal/orders/${o.id}`)}>
                  <td className="px-4 py-3 font-medium text-foreground">{o.reference}</td>
                  <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full">{o.status.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
