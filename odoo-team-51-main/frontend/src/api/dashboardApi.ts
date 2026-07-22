import { apiFetch } from './client';
import type { DashboardMetrics } from '../types';

export function getDashboard() {
  return apiFetch<DashboardMetrics>('/api/dashboard');
}
