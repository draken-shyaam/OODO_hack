import { apiFetch } from './client';

export interface ProductionHealthResult {
  workCenters: { id: number; name: string; utilizationPct: number; queueLength: number; idle: boolean }[];
  burnoutFlags: { userId: number; name: string; totalMins: number; thresholdMins: number }[];
}

export function getProductionHealth() {
  return apiFetch<ProductionHealthResult>('/api/production-health');
}
