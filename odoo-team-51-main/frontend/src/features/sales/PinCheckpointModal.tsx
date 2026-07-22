import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { getPinCheckpoint, type ProductPinResult, type PinAction, type PinActionType } from '../../api/pinApi';

interface PinCheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { productId: number; qty: number }[];
  onConfirm: (actions: PinAction[]) => void;
}

const SEVERITY_VARIANT: Record<string, 'danger' | 'warning' | 'info'> = { high: 'danger', medium: 'warning', low: 'info' };

/** Checkbox identity = type + vendorId, since the same product can offer
 * both an EXPEDITE and a VENDOR_SWITCH box that must be selectable independently. */
function actionKey(productId: number, type: PinActionType, vendorId?: number) {
  return `${productId}:${type}:${vendorId ?? ''}`;
}

export function PinCheckpointModal({ isOpen, onClose, items, onConfirm }: PinCheckpointModalProps) {
  const [results, setResults] = useState<ProductPinResult[] | null>(null);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setResults(null);
      setError('');
      setChecked(new Set());
      getPinCheckpoint(items).then(setResults).catch((e) => setError(e.message));
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const buildActions = (): PinAction[] => {
    const actions: PinAction[] = [];
    for (const product of results ?? []) {
      for (const rec of product.recommendations) {
        if (checked.has(actionKey(product.productId, rec.type, rec.vendorId))) {
          actions.push({ productId: product.productId, type: rec.type, vendorId: rec.vendorId, qty: rec.suggestedQty });
        }
      }
    }
    return actions;
  };

  const totalCostImpact = (results ?? []).reduce(
    (sum, product) =>
      sum +
      product.recommendations
        .filter((rec) => checked.has(actionKey(product.productId, rec.type, rec.vendorId)))
        .reduce((s, rec) => s + rec.costImpact, 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl shadow-floating animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            PIN Checkpoint — Field Signals Before You Confirm
          </CardTitle>
          <p className="text-sm text-foreground/60 mt-1">
            What suppliers, transporters, and staff have reported about these products recently — computed live, not stored.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {!results && !error && (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground/60 py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking field signals...
            </div>
          )}

          {results?.map((product) => (
            <div key={product.productId} className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">{product.productName}</h4>
                {!product.hasSignals && (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck className="w-3 h-3" /> No active signals
                  </Badge>
                )}
              </div>

              {!product.hasSignals && (
                <p className="text-xs text-foreground/50">Checked field reports and the database — nothing flagged for this product.</p>
              )}

              {product.signals.map((s, i) => (
                <div key={i} className="mb-2 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={SEVERITY_VARIANT[s.severity]} className="text-[10px] uppercase">{s.signalType.replace('_', ' ')}</Badge>
                    <span className="text-xs text-foreground/70 font-medium">{s.confidence}% confidence</span>
                    <span className="text-xs text-foreground/50">
                      {s.corroborationCount} report{s.corroborationCount > 1 ? 's' : ''} · {s.reporterTypes.join(', ')}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 mt-0.5">{s.descriptions[s.descriptions.length - 1]}</p>
                </div>
              ))}

              {product.recommendations.length > 0 && (
                <div className="mt-3 space-y-1.5 pl-1">
                  {product.recommendations.map((rec) => {
                    const key = actionKey(product.productId, rec.type, rec.vendorId);
                    return (
                      <label key={key} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={checked.has(key)}
                          onChange={() => toggle(key)}
                          disabled={rec.type === 'ACCEPT_RISK'}
                        />
                        <span className={rec.type === 'ACCEPT_RISK' ? 'text-foreground/50' : 'text-foreground'}>{rec.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {results && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-sm text-foreground/60">
                Net cost impact of checked actions: <strong className={totalCostImpact > 0 ? 'text-red-600 dark:text-red-400' : totalCostImpact < 0 ? 'text-green-600 dark:text-green-400' : ''}>₹{totalCostImpact.toFixed(2)}</strong>
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onConfirm([])}>Confirm as Normal</Button>
                <Button onClick={() => onConfirm(buildActions())}>Confirm with Recommendations</Button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} variant="ghost" className="text-xs text-foreground/50">Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
