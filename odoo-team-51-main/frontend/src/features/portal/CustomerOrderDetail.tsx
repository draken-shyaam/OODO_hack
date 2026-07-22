import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Circle, Truck, Package } from 'lucide-react';
import type { SalesOrder } from '../../types';
import { getMyOrder } from '../../api/portalApi';

const STEPS = [
  { key: 'draft', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: Circle },
  { key: 'partially_delivered', label: 'In Transit', icon: Truck },
  { key: 'fully_delivered', label: 'Delivered', icon: CheckCircle2 },
];
const STEP_ORDER = STEPS.map((s) => s.key);

export function CustomerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    getMyOrder(Number(id)).then(setOrder).catch(console.error);
  }, [id]);

  if (!order) return <div>Loading...</div>;

  const currentIndex = order.status === 'cancelled' ? -1 : STEP_ORDER.indexOf(order.status);
  const total = order.lines.reduce((sum, l) => sum + l.orderedQty * l.salesUnitPrice, 0);
  const canReview = order.status === 'fully_delivered' || order.status === 'partially_delivered';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/portal/orders')} className="text-sm text-foreground/60 hover:text-foreground mb-2 block">&larr; Back to Orders</button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Order {order.reference}</h1>
        </div>
        {canReview && <Button variant="secondary" onClick={() => navigate('/portal/reviews')}>Leave a Review</Button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Items Ordered</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {order.lines.map((line) => (
                  <div key={line.id} className="py-3 flex justify-between">
                    <div>
                      <p className="font-medium">{line.product?.name ?? line.productId}</p>
                      <p className="text-sm text-foreground/60">Ordered: {line.orderedQty} · Delivered: {line.deliveredQty}</p>
                    </div>
                    <p className="font-medium">₹{(line.orderedQty * line.salesUnitPrice).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/50 pt-4 mt-4 flex justify-between">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-semibold text-lg">₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Order Status</CardTitle></CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6 pb-2">
                {STEPS.map((step, i) => {
                  const completed = order.status === 'cancelled' ? false : i <= currentIndex;
                  return (
                    <div key={step.key} className="relative">
                      <div className={`absolute -left-[35px] bg-card p-1 rounded-full ${completed ? 'text-primary' : 'text-gray-300'}`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <h4 className={`font-medium ${completed ? 'text-foreground' : 'text-foreground/60'}`}>{step.label}</h4>
                    </div>
                  );
                })}
                {order.status === 'cancelled' && <p className="text-sm text-red-600 font-medium">Order Cancelled</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
