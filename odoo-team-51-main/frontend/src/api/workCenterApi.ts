import { apiFetch } from './client';

export interface WorkCenter {
  id: number;
  name: string;
  shiftCapacityMins: number;
}

export function listWorkCenters() {
  return apiFetch<WorkCenter[]>('/api/work-centers');
}
