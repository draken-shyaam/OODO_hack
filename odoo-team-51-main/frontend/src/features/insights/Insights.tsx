import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '../../components/ui/Badge';
import type { Product } from '../../types';
import { listProducts } from '../../api/productApi';
import { getForecast, getParetoAnalysis, getBatchPurchaseSuggestions, type ForecastResult, type ParetoResult, type BatchPurchaseSuggestion } from '../../api/insightsApi';

export function Insights() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [pareto, setPareto] = useState<ParetoResult | null>(null);
  const [batchSuggestions, setBatchSuggestions] = useState<BatchPurchaseSuggestion[]>([]);

  useEffect(() => {
    listProducts().then((p) => {
      setProducts(p);
      if (p.length > 0) setSelectedProductId(p[0].id);
    }).catch(console.error);
    getParetoAnalysis().then(setPareto).catch(console.error);
    getBatchPurchaseSuggestions().then(setBatchSuggestions).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProductId) getForecast(Number(selectedProductId)).then(setForecast).catch(console.error);
  }, [selectedProductId]);

  const chartData = forecast ? [...forecast.history, ...forecast.forecast.map((f) => ({ ...f, projected: true }))] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights & Forecasting</h1>
        <p className="text-foreground/60">Data-driven suggestions for procurement and sales — every number computed from real ledger data, never fabricated.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Demand Forecasting</CardTitle>
          </CardHeader>
          <CardContent>
            <select className="mb-4 border border-border rounded px-3 py-2 text-sm w-full" value={selectedProductId} onChange={(e) => setSelectedProductId(Number(e.target.value))}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {forecast?.insufficientData ? (
              <p className="text-sm text-foreground/60 p-4 text-center">Not enough sales history yet to forecast this product.</p>
            ) : (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="qty" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {forecast?.suggestedReorderQty !== null && forecast && (
                  <div className="mt-4 flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Suggested Reorder Qty</span>
                    <span className="text-sm text-blue-800 dark:text-blue-400">{forecast.suggestedReorderQty} units</span>
                  </div>
                )}
                {forecast?.insight && <p className="mt-3 text-sm text-foreground/70">{forecast.insight}</p>}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pareto Analysis (Profit)</CardTitle>
          </CardHeader>
          <CardContent>
            {pareto?.insufficientData || !pareto?.products.length ? (
              <p className="text-sm text-foreground/60 p-4 text-center">Not enough delivered sales yet to rank profit drivers.</p>
            ) : (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pareto.products}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-foreground/60 text-center">
                  Top 20%: {pareto.products.filter((p) => p.isTop20).map((p) => p.name).join(', ') || 'none yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Batch Purchase Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            {batchSuggestions.length === 0 ? (
              <p className="text-sm text-foreground/60 p-4 text-center">No fragmented draft purchase orders to merge right now.</p>
            ) : (
              <div className="space-y-3">
                {batchSuggestions.map((s) => (
                  <div key={s.vendorId} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">{s.draftPoIds.length} Draft POs</Badge>
                        <span className="font-medium">{s.vendorName}</span>
                      </div>
                      <p className="text-sm text-foreground/60 mt-1">
                        {s.draftPoReferences.join(', ')} could be merged into one order of {s.suggestedMergedQty} units.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
