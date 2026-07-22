import React from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { useNavigate } from 'react-router-dom';

interface FormViewProps {
  title: string;
  reference?: string;
  status?: string;
  statusColor?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onBack?: () => void;
  /** Audit module key (e.g. "sales") to pre-filter the Logs button into — omit to hide the button (e.g. for an unsaved "new" record with no logs yet). */
  auditModule?: string;
  /** Record id to pre-filter the Logs button into, paired with auditModule. */
  auditRecordId?: number;
  /** Entity name (e.g. "Bom") to disambiguate recordId across entities that share the same module but aren't in the PermissionModule enum on their own. */
  auditEntity?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function FormView({
  title,
  reference,
  status,
  statusColor = 'default',
  onBack,
  auditModule,
  auditRecordId,
  auditEntity,
  actions,
  children
}: FormViewProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleLogs = () => {
    if (!auditModule || !auditRecordId) return;
    const entityParam = auditEntity ? `&entity=${auditEntity}` : '';
    navigate(`/audit?module=${auditModule}&recordId=${auditRecordId}${entityParam}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {reference && (
              <span className="text-lg text-foreground/60 font-mono">{reference}</span>
            )}
            {status && (
              <Badge variant={statusColor} className="ml-2 uppercase tracking-wider text-[10px]">
                {status}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Logs Button */}
        {auditModule && auditRecordId && (
          <Button variant="ghost" className="gap-2 text-foreground/60" onClick={handleLogs}>
            <History className="w-4 h-4" /> Logs
          </Button>
        )}
      </div>

      {/* Action Bar */}
      {actions && (
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl shadow-sm">
          {actions}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}
