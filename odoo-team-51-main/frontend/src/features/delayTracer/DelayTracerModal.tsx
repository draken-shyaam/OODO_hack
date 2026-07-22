import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { traceDelay } from '../../api/delayTraceApi';
import { useSocketEvent } from '../../hooks/useSocket';
import type { DelayTraceResult } from '../../types';

interface DelayTracerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderType: 'sales_order' | 'purchase_order' | 'manufacturing_order';
}

interface OrderStatusChangedPayload {
  orderType: 'sales_order' | 'purchase_order' | 'manufacturing_order';
  orderId: number;
  newStatus: string;
}

/** Same shell/spacing/severity-color vocabulary as PinCheckpointModal — both
 * are "click something, see a structured explanation overlay," so they
 * should read as one coherent app, not two differently-styled prototypes. */
export function DelayTracerModal({ isOpen, onClose, orderId, orderType }: DelayTracerModalProps) {
  const [result, setResult] = useState<DelayTraceResult | null>(null);
  const [error, setError] = useState('');
  const [justResolved, setJustResolved] = useState(false);

  const fetchTrace = () => traceDelay(orderType, orderId).then(setResult).catch((e) => setError(e.message));

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setError('');
      setJustResolved(false);
      fetchTrace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId, orderType]);

  // Live update: if the root-cause node's status changes anywhere in the app
  // (e.g. a teammate marks the blocking PO Received in another tab) while
  // this modal is open, refetch the chain instead of requiring a reopen.
  useSocketEvent<OrderStatusChangedPayload>('order:status_changed', (payload) => {
    if (!isOpen || !result?.rootCause) return;
    if (payload.orderType === result.rootCause.type && payload.orderId === result.rootCause.id) {
      setJustResolved(true);
      fetchTrace();
    }
  });

  if (!isOpen) return null;

  const TERMINAL = new Set(['fully_delivered', 'fully_received', 'done', 'cancelled']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-floating animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Why Is It Late?
          </CardTitle>
          <p className="text-sm text-foreground/60 mt-1">
            Walking PINERP's own procurement chain backward from this order — not a guess, the actual linked records.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!result && !error && (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground/60 py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Tracing the chain...
            </div>
          )}

          {justResolved && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-800 dark:text-green-400 text-sm font-medium px-3 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Updated live — the root cause just changed status.
            </div>
          )}

          {result && (
            <>
              <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6">
                {result.chain.map((node) => {
                  const isRoot = node.role === 'root_cause';
                  const resolved = TERMINAL.has(node.status) || node.resolved;
                  const Icon = resolved ? CheckCircle2 : isRoot ? AlertCircle : Clock;
                  const color = resolved ? 'text-green-600 dark:text-green-400' : isRoot ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400';
                  return (
                    <div key={`${node.type}-${node.id}`} className={`relative ${isRoot && !resolved ? 'bg-red-50 dark:bg-red-500/10 -ml-3 pl-3 py-2 rounded-lg border border-red-100 dark:border-red-500/20' : ''}`}>
                      <div className={`absolute -left-[35px] bg-card p-1 rounded-full ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{node.label}</h4>
                        {isRoot && <Badge variant="danger" className="text-[10px] uppercase">Root Cause</Badge>}
                        {node.role === 'symptom' && <Badge variant="info" className="text-[10px] uppercase">You clicked this</Badge>}
                      </div>
                      <p className={`text-sm ${color} font-medium`}>{node.status.replace(/_/g, ' ')}</p>
                      {node.expectedDate && (
                        <p className="text-xs text-foreground/60 mt-0.5">
                          Expected {new Date(node.expectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {!resolved && node.daysOverdue !== null && node.daysOverdue !== undefined && node.daysOverdue > 0 && (
                            <span className="text-red-600 dark:text-red-400 font-medium"> · {node.daysOverdue} day{node.daysOverdue === 1 ? '' : 's'} overdue</span>
                          )}
                        </p>
                      )}
                      {node.auditEvents.length > 0 && (
                        <ul className="mt-1 text-xs text-foreground/50 space-y-0.5">
                          {node.auditEvents.slice(-2).map((e, i) => (
                            <li key={i}>
                              {new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — {e.action}
                              {e.fieldChanged ? `: ${e.fieldChanged}${e.newValue ? ` → ${e.newValue}` : ''}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-100 dark:border-red-500/20">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium leading-relaxed">{result.explanation}</p>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
