import { apiFetch, buildQuery } from './client';
import type { Bom } from '../types';

export function listBoms(params?: { search?: string }) {
  return apiFetch<Bom[]>(`/api/bom${buildQuery(params ?? {})}`);
}

export function getBom(id: number) {
  return apiFetch<Bom>(`/api/bom/${id}`);
}

export function createBom(data: {
  productId: number;
  quantity: number;
  shortReference?: string;
  components: { componentId: number; toConsumeQty: number }[];
  workOrderTemplates: { operation: string; workCenterId: number; expectedDurationMins: number }[];
}) {
  return apiFetch<Bom>('/api/bom', { method: 'POST', body: data });
}

export function updateBom(id: number, data: Partial<{
  quantity: number;
  shortReference: string;
  components: { componentId: number; toConsumeQty: number }[];
  workOrderTemplates: { operation: string; workCenterId: number; expectedDurationMins: number }[];
}>) {
  return apiFetch<Bom>(`/api/bom/${id}`, { method: 'PATCH', body: data });
}

export function deleteBom(id: number) {
  return apiFetch<void>(`/api/bom/${id}`, { method: 'DELETE' });
}
