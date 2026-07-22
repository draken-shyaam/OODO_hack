import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, RotateCcw, CalendarDays } from 'lucide-react';
import { getAuditLogs, type AuditLogResponse } from '../../api/auditApi';
import { listUsers } from '../../api/userManagementApi';
import { useSocketEvent } from '../../hooks/useSocket';
import type { AuditLogRow } from '../../types';

const MODULE_LABEL: Record<string, string> = {
  sales: 'Sales',
  purchase: 'Purchase',
  manufacturing: 'Manufacturing',
  product: 'Product',
};

const RECORD_TYPE_LABEL: Record<string, string> = {
  Product: 'Product',
  SalesOrder: 'Sales Order',
  PurchaseOrder: 'Purchase Order',
  ManufacturingOrder: 'Manufacturing Order',
};

const ACTION_STYLE: Record<string, string> = {
  created: 'text-emerald-600 dark:text-emerald-400',
  updated: 'text-amber-600 dark:text-amber-400',
  deleted: 'text-red-600 dark:text-red-400',
};

interface Filters {
  dateFrom: string;
  dateTo: string;
  user: string;
  module: string;
  action: string;
  recordId: string;
  entity: string;
}

const EMPTY_FILTERS: Filters = { dateFrom: '', dateTo: '', user: '', module: '', action: '', recordId: '', entity: '' };

function formatDateLabel(value: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function pageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, 3, total]);
  if (current > 1 && current < total) pages.add(current);
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis');
    result.push(p);
    prev = p;
  }
  return result;
}

export function AuditLogs() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    module: searchParams.get('module') ?? '',
    recordId: searchParams.get('recordId') ?? '',
    entity: searchParams.get('entity') ?? '',
  });
  const [page, setPage] = useState(1);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const load = (f: Filters = filters, p: number = page) => {
    getAuditLogs({ ...f, page: p }).then(setData).catch(console.error);
  };

  useEffect(() => {
    load();
    listUsers().then((rows) => setUsers(rows.map((u) => ({ id: u.id, name: u.name })))).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSocketEvent('audit:entry_created', () => load());

  const applyFilters = () => {
    setPage(1);
    load(filters, 1);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    load(EMPTY_FILTERS, 1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    load(filters, p);
  };

  const dateRangeLabel =
    filters.dateFrom && filters.dateTo
      ? `${formatDateLabel(filters.dateFrom)} - ${formatDateLabel(filters.dateTo)}`
      : 'Select date range';

  const summary = data?.summary ?? { total: 0, created: 0, updated: 0, deleted: 0 };
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Logs</p>
          <p className="text-3xl font-semibold text-foreground mt-1">{summary.total}</p>
          <p className="text-xs text-muted-foreground mt-1">All time logs</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Create Actions</p>
          <p className="text-3xl font-semibold text-foreground mt-1">{summary.created}</p>
          <p className="text-xs text-muted-foreground mt-1">Records Created</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">Update Actions</p>
          <p className="text-3xl font-semibold text-foreground mt-1">{summary.updated}</p>
          <p className="text-xs text-muted-foreground mt-1">Records Updated</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-red-600 dark:text-red-400">Delete Actions</p>
          <p className="text-3xl font-semibold text-foreground mt-1">{summary.deleted}</p>
          <p className="text-xs text-muted-foreground mt-1">Records Deleted</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative">
          <label className="block text-xs text-muted-foreground mb-1">Date Range</label>
          <button
            onClick={() => setDatePopoverOpen((o) => !o)}
            className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground min-w-55 hover:bg-secondary transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            {dateRangeLabel}
          </button>
          {datePopoverOpen && (
            <div className="absolute z-50 mt-2 bg-card border border-border rounded-lg p-3 flex gap-2 shadow-floating animate-in fade-in zoom-in-95 duration-150">
              <input
                type="date"
                className="input w-auto!"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
              <input
                type="date"
                className="input w-auto!"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
              <button
                onClick={() => setDatePopoverOpen(false)}
                className="btn btn-primary px-2 py-1 text-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">User</label>
          <select
            className="input"
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Module</label>
          <select
            className="input"
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
          >
            <option value="">All Modules</option>
            <option value="sales">Sales</option>
            <option value="purchase">Purchase</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="product">Product</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Actions</label>
          <select
            className="input"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        <button onClick={applyFilters} className="btn btn-primary interactive gap-2">
          <Filter className="w-4 h-4" /> Filter
        </button>
        <button onClick={resetFilters} className="btn interactive gap-2 border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => page > 1 && goToPage(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1 text-muted-foreground">...</span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-7 h-7 rounded text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => page < totalPages && goToPage(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
                <th className="px-4 py-3 whitespace-nowrap">User</th>
                <th className="px-4 py-3 whitespace-nowrap">Module</th>
                <th className="px-4 py-3 whitespace-nowrap">Record Type</th>
                <th className="px-4 py-3 whitespace-nowrap">Record ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Action</th>
                <th className="px-4 py-3 whitespace-nowrap">Field Changed</th>
                <th className="px-4 py-3 whitespace-nowrap">Old Value</th>
                <th className="px-4 py-3 whitespace-nowrap">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.rows ?? []).map((row: AuditLogRow) => (
                <tr key={row.id} className="hover:bg-secondary transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/80">
                    {new Date(row.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">{row.user?.name ?? 'System'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/80">{MODULE_LABEL[row.module] ?? row.module}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/80">{RECORD_TYPE_LABEL[row.entity] ?? row.entity}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/80">{row.recordRef ?? `${row.entity}-${row.recordId}`}</td>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${ACTION_STYLE[row.action]}`}>
                    {row.action.charAt(0).toUpperCase() + row.action.slice(1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/80">{row.fieldChanged ?? '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/80">{row.oldValue ?? '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/80">{row.newValue ?? '-'}</td>
                </tr>
              ))}
              {(data?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No audit log entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
