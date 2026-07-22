import { apiFetch } from './client';
import type { SalesOrder, CustomerReview, CustomerCommunication, Customer } from '../types';

/** Validates the portal session against the backend and returns the current customer's profile — used by PortalProtectedRoute on bootstrap. */
export function getMyPortalProfile() {
  return apiFetch<Customer>('/api/portal/me', { portal: true });
}

export function listMyOrders() {
  return apiFetch<SalesOrder[]>('/api/portal/orders', { portal: true });
}

export function getMyOrder(id: number) {
  return apiFetch<SalesOrder>(`/api/portal/orders/${id}`, { portal: true });
}

export function listMyReviews() {
  return apiFetch<CustomerReview[]>('/api/portal/reviews', { portal: true });
}

export function createReview(salesOrderId: number, rating: number, comment?: string) {
  return apiFetch<CustomerReview>('/api/portal/reviews', { method: 'POST', body: { salesOrderId, rating, comment }, portal: true });
}

export function listMyMessages() {
  return apiFetch<CustomerCommunication[]>('/api/portal/messages', { portal: true });
}

export function sendMessage(message: string) {
  return apiFetch<CustomerCommunication>('/api/portal/messages', { method: 'POST', body: { message }, portal: true });
}
