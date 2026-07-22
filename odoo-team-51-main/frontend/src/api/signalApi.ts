import { apiFetch } from './client';
import type { MarketSignal } from '../types';

export function listSignals() {
  return apiFetch<MarketSignal[]>('/api/signals');
}

export function createSignal(data: {
  sourceType: string;
  productId?: number;
  category?: string;
  signalType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}) {
  return apiFetch<MarketSignal>('/api/signals', { method: 'POST', body: data });
}

export function getActiveSignals(productIds: number[], categories: string[] = []) {
  const params = new URLSearchParams();
  if (productIds.length) params.set('productIds', productIds.join(','));
  if (categories.length) params.set('categories', categories.join(','));
  return apiFetch<MarketSignal[]>(`/api/signals/active?${params.toString()}`);
}
