import { apiFetch } from './client';
import type { AuditLogRow } from '../types';

export interface AuditLogResponse {
  summary: { total: number; created: number; updated: number; deleted: number };
  rows: AuditLogRow[];
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getAuditLogs(filters: { dateFrom?: string; dateTo?: string; user?: string; module?: string; action?: string; recordId?: string; entity?: string; page?: number }) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  return apiFetch<AuditLogResponse>(`/api/audit?${params.toString()}`);
}
