import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { SalesOrder, CustomerReview } from '../../types';
import { listMyOrders, listMyReviews, createReview } from '../../api/portalApi';
import { ApiError } from '../../api/client';

export function PortalReviews() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [rating, setRating] = useState<Record<number, number>>({});
  const [comment, setComment] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  const load = () => {
    listMyOrders().then(setOrders).catch(console.error);
    listMyReviews().then(setReviews).catch(console.error);
  };

  useEffect(load, []);

  const reviewableOrders = orders.filter((o) => (o.status === 'fully_delivered' || o.status === 'partially_delivered') && !reviews.some((r) => r.salesOrderId === o.id));

  const handleSubmit = async (orderId: number) => {
    try {
      await createReview(orderId, rating[orderId] ?? 5, comment[orderId]);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not submit review');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
      {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}

      {reviewableOrders.map((o) => (
        <Card key={o.id}>
          <CardHeader><CardTitle>{o.reference}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating({ ...rating, [o.id]: star })} className={`text-2xl ${(rating[o.id] ?? 5) >= star ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
              ))}
            </div>
            <textarea className="w-full border border-border rounded px-3 py-2 text-sm" placeholder="Comment (optional)" value={comment[o.id] ?? ''} onChange={(e) => setComment({ ...comment, [o.id]: e.target.value })} />
            <Button onClick={() => handleSubmit(o.id)}>Submit Review</Button>
          </CardContent>
        </Card>
      ))}

      {reviewableOrders.length === 0 && reviews.length === 0 && (
        <p className="text-sm text-foreground/60">No delivered orders available to review yet.</p>
      )}

      {reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Reviews</h2>
          <div className="space-y-2">
            {reviews.map((r) => (
              <Card key={r.id} className="p-4">
                <p className="font-medium">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                {r.comment && <p className="text-sm text-foreground/70 mt-1">{r.comment}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
