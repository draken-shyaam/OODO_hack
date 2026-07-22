import { apiFetch } from './client';
import type { DelayTraceResult } from '../types';

export function traceDelay(orderType: 'sales_order' | 'purchase_order' | 'manufacturing_order', orderId: number) {
  return apiFetch<DelayTraceResult>(`/api/delay-trace/${orderType}/${orderId}`);
}
