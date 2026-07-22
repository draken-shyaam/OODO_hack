import { apiFetch } from './client';
import type { Vendor, VendorPerformance } from '../types';

export function listVendors(search?: string) {
  return apiFetch<Vendor[]>(`/api/vendors${search ? `?search=${encodeURIComponent(search)}` : ''}`);
}

export function getVendor(id: number) {
  return apiFetch<Vendor>(`/api/vendors/${id}`);
}

export function createVendor(data: { name: string; address?: string; contact?: string }) {
  return apiFetch<Vendor>('/api/vendors', { method: 'POST', body: data });
}

export function updateVendor(id: number, data: Partial<{ name: string; address: string; contact: string }>) {
  return apiFetch<Vendor>(`/api/vendors/${id}`, { method: 'PATCH', body: data });
}

export function deleteVendor(id: number) {
  return apiFetch<void>(`/api/vendors/${id}`, { method: 'DELETE' });
}

export function getVendorPerformance(id: number) {
  return apiFetch<VendorPerformance>(`/api/vendors/${id}/performance`);
}

export function addQualityIncident(id: number, description: string, severity: 'low' | 'medium' | 'high') {
  return apiFetch(`/api/vendors/${id}/quality-incidents`, { method: 'POST', body: { description, severity } });
}
