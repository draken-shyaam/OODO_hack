import { apiFetch } from './client';

export type PinActionType = 'EXPEDITE' | 'VENDOR_SWITCH' | 'QTY_ADJUST' | 'ACCEPT_RISK';

export interface PinRecommendation {
  type: PinActionType;
  label: string;
  costImpact: number;
  timeImpactDays: number;
  vendorId?: number;
  suggestedQty?: number;
}

export interface PinSignalSummary {
  signalType: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  corroborationCount: number;
  reporterTypes: string[];
  descriptions: string[];
}

export interface ProductPinResult {
  productId: number;
  productName: string;
  hasSignals: boolean;
  signals: PinSignalSummary[];
  recommendations: PinRecommendation[];
}

export interface PinAction {
  productId: number;
  type: PinActionType;
  vendorId?: number;
  qty?: number;
}

export function getPinCheckpoint(items: { productId: number; qty: number }[]) {
  const productIds = items.map((i) => i.productId).join(',');
  const qtys = items.map((i) => i.qty).join(',');
  return apiFetch<ProductPinResult[]>(`/api/pin/signals?productIds=${productIds}&qtys=${qtys}`);
}
