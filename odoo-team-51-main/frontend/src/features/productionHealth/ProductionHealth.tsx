import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getProductionHealth, type ProductionHealthResult } from '../../api/productionHealthApi';
import { useSocketEvent } from '../../hooks/useSocket';

export function ProductionHealth() {
  const [data, setData] = useState<ProductionHealthResult | null>(null);

  const refresh = () => getProductionHealth().then(setData).catch(console.error);

  useEffect(() => {
    refresh();
  }, []);

  // Utilization/queue/burnout all derive from Work Order minutes on
  // "in_progress" Manufacturing Orders — Confirm/Start/Produce on any MO
  // changes that set, so this page needs to react the same way Dashboard
  // already does, instead of only ever reflecting whatever was true on load.
  useSocketEvent<{ orderType: string }>('order:status_changed', (p) => {
    if (p.orderType === 'manufacturing_order') refresh();
  });

  if (!data) return <div>Loading...</div>;

  const overloaded = data.workCenters.filter((w) => w.utilizationPct > 90);
  const idle = data.workCenters.filter((w) => w.idle);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Production Health</h1>
        <p className="text-foreground/60">Work center capacity and operator utilization, computed from real Work Order data.</p>
      </div>

      {overloaded.length > 0 && idle.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <h4 className="font-medium text-blue-900 dark:text-blue-300">Suggest Redistribution</h4>
          <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
            "{overloaded[0].name}" is at {overloaded[0].utilizationPct}% capacity while "{idle[0].name}" is idle. Consider moving work between them.
          </p>
        </div>
      )}

      {data.burnoutFlags.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
          <h4 className="font-medium text-red-900 dark:text-red-300">Operator Burnout Risk</h4>
          {data.burnoutFlags.map((f) => (
            <p key={f.userId} className="text-sm text-red-800 dark:text-red-400 mt-1">
              {f.name} is assigned {f.totalMins} minutes of active work (threshold: {f.thresholdMins} min).
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.workCenters.map((wc) => {
          const status = wc.utilizationPct > 90 ? 'Overloaded' : wc.idle ? 'Idle' : 'Normal';
          return (
            <Card key={wc.id} className={status === 'Overloaded' ? 'border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{wc.name}</CardTitle>
                <p className={`text-xs font-medium ${status === 'Overloaded' ? 'text-red-600' : status === 'Idle' ? 'text-foreground/60' : 'text-green-600'}`}>{status}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground/60">Utilization</span>
                      <span className="font-medium">{wc.utilizationPct}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${wc.utilizationPct > 90 ? 'bg-red-500' : wc.utilizationPct > 75 ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, wc.utilizationPct)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <span className="text-sm text-foreground/60">Queue Length</span>
                    <span className="font-medium text-lg">{wc.queueLength}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
