import { apiFetch } from './client';
import type { Customer } from '../types';

export function listCustomers(search?: string) {
  return apiFetch<Customer[]>(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
}

export function getCustomer(id: number) {
  return apiFetch<Customer>(`/api/customers/${id}`);
}
