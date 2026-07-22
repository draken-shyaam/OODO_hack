import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import { Badge } from '../../components/ui/Badge';
import type { MarketSignal } from '../../types';
import { listSignals } from '../../api/signalApi';
import { useSocketEvent } from '../../hooks/useSocket';

export function SignalList() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<MarketSignal[]>([]);

  const refresh = () => listSignals().then(setSignals).catch(console.error);

  useEffect(() => { refresh(); }, []);
  useSocketEvent('signal:created', refresh);

  const columns = [
    { header: 'Source Type', accessor: (row: MarketSignal) => row.sourceType.replace(/_/g, ' ') },
    { header: 'Product/Category', accessor: (row: MarketSignal) => row.product?.name ?? row.category ?? '-' },
    { header: 'Signal Type', accessor: (row: MarketSignal) => row.signalType.replace(/_/g, ' ') },
    {
      header: 'Severity',
      accessor: (row: MarketSignal) => (
        <Badge variant={row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'}>
          {row.severity}
        </Badge>
      ),
    },
    { header: 'Reported By', accessor: (row: MarketSignal) => row.reportedByUser?.name ?? '-' },
    { header: 'Date', accessor: (row: MarketSignal) => new Date(row.reportedAt).toLocaleDateString() },
  ];

  return (
    <ListView
      title="Market Signals"
      data={signals}
      columns={columns}
      onNew={() => navigate('/signals/new')}
      viewMode="list"
    />
  );
}
