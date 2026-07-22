import { apiFetch } from './client';

export interface ForecastResult {
  history: { period: string; qty: number }[];
  forecast: { period: string; qty: number }[];
  suggestedReorderQty: number | null;
  insufficientData: boolean;
  insight?: string;
}

export interface ParetoResult {
  products: { productId: number; name: string; profit: number; cumulativePct: number; isTop20: boolean }[];
  insufficientData: boolean;
}

export interface BatchPurchaseSuggestion {
  vendorId: number;
  vendorName: string;
  draftPoIds: number[];
  draftPoReferences: string[];
  suggestedMergedQty: number;
}

export function getForecast(productId: number) {
  return apiFetch<ForecastResult>(`/api/insights/forecast/${productId}`);
}

export function getParetoAnalysis() {
  return apiFetch<ParetoResult>('/api/insights/pareto');
}

export function getBatchPurchaseSuggestions() {
  return apiFetch<BatchPurchaseSuggestion[]>('/api/insights/batch-purchase-suggestions');
}
