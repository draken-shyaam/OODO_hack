import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getDashboard } from '../../api/dashboardApi';
import type { DashboardMetrics } from '../../types';
import { useSocketEvent } from '../../hooks/useSocket';

// Order matches the wireframe's left-to-right pill layout per module.
const STATUS_ORDER = [
  'draft', 'confirmed', 'partially_delivered', 'partially_received',
  'in_progress', 'to_close', 'fully_delivered', 'fully_received', 'done', 'late', 'cancelled',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  partially_delivered: 'Partially Delivered',
  fully_delivered: 'Delivered',
  partially_received: 'Partially Received',
  fully_received: 'Received',
  in_progress: 'In Progress',
  to_close: 'To Close',
  done: 'Done',
  late: 'Late',
  cancelled: 'Cancelled',
};

function StatusPill({ label, count, isLate, isActive }: { label: string; count: number; isLate?: boolean; isActive?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-w-[64px] px-3 py-2 rounded-lg border transition-colors ${
        isActive
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
          : isLate
          ? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10'
          : 'border-border bg-secondary'
      }`}
    >
      <span className={`text-lg font-semibold ${isLate ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{count}</span>
      <span className={`text-[11px] text-center leading-tight ${isLate ? 'text-red-600 dark:text-red-400' : 'text-foreground/60'}`}>{label}</span>
    </div>
  );
}

function ModuleCard({
  title,
  basePath,
  all,
  my,
  activeStatus,
  onSelectStatus,
}: {
  title: string;
  basePath: string;
  all: Record<string, number>;
  my: Record<string, number>;
  activeStatus: string | null;
  onSelectStatus: (basePath: string, status: string) => void;
}) {
  const navigate = useNavigate();
  const statuses = STATUS_ORDER.filter((s) => s in all || s in my);

  return (
    <Card className="p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Button onClick={() => navigate(`${basePath}/new`)} className="gap-1.5 h-8 px-3 text-xs">
          <Plus className="w-3.5 h-3.5" /> New
        </Button>
      </div>

      <div className="mb-3">
        <p className="text-xs font-medium text-foreground/50 mb-2 uppercase tracking-wide">All</p>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button key={s} onClick={() => onSelectStatus(basePath, s)}>
              <StatusPill
                label={STATUS_LABELS[s]}
                count={all[s] ?? 0}
                isLate={s === 'late'}
                isActive={activeStatus === `${basePath}:${s}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground/50 mb-2 uppercase tracking-wide">My</p>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button key={s} onClick={() => onSelectStatus(basePath, s)}>
              <StatusPill
                label={STATUS_LABELS[s]}
                count={my[s] ?? 0}
                isLate={s === 'late'}
                isActive={activeStatus === `${basePath}:${s}`}
              />
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = () => getDashboard().then(setMetrics).catch((e) => setError(e.message));

  useEffect(() => {
    refresh();
  }, []);

  // Live updates: any order status change or stock movement refreshes the
  // counts without a manual reload.
  useSocketEvent('order:status_changed', refresh);
  useSocketEvent('stock:updated', refresh);

  const handleSelectStatus = (basePath: string, status: string) => {
    setActiveStatus(`${basePath}:${status}`);
    navigate(`${basePath}?status=${status}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time order status across Sales, Purchase, and Manufacturing.</p>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ModuleCard title="Sale Orders" basePath="/sales" all={metrics.sales.all} my={metrics.sales.my} activeStatus={activeStatus} onSelectStatus={handleSelectStatus} />
          <ModuleCard title="Purchase Orders" basePath="/purchase" all={metrics.purchase.all} my={metrics.purchase.my} activeStatus={activeStatus} onSelectStatus={handleSelectStatus} />
          <ModuleCard title="Manufacturing Orders" basePath="/manufacturing" all={metrics.manufacturing.all} my={metrics.manufacturing.my} activeStatus={activeStatus} onSelectStatus={handleSelectStatus} />
        </div>
      )}
    </div>
  );
}
