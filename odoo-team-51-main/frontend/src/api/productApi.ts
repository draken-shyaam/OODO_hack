import { apiFetch, ApiError } from './client';
import type { Product } from '../types';

export function listProducts(search?: string) {
  return apiFetch<Product[]>(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
}

export function getProduct(id: number) {
  return apiFetch<Product>(`/api/products/${id}`);
}

export function createProduct(data: Partial<Product>) {
  return apiFetch<Product>('/api/products', { method: 'POST', body: data });
}

export function updateProduct(id: number, data: Partial<Product>) {
  return apiFetch<Product>(`/api/products/${id}`, { method: 'PATCH', body: data });
}

export function deleteProduct(id: number) {
  return apiFetch<void>(`/api/products/${id}`, { method: 'DELETE' });
}

export function reconcileStock(id: number, newOnHandQty: number, reason: string) {
  return apiFetch<Product>(`/api/products/${id}/reconcile-stock`, { method: 'POST', body: { newOnHandQty, reason } });
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Bypasses apiFetch — that wrapper always JSON.stringifies the body and sets
 * Content-Type: application/json, which would corrupt a multipart upload.
 * The browser must set its own Content-Type (with the multipart boundary)
 * for FormData, so this builds the request by hand instead. The session
 * cookie is sent automatically via `credentials: 'include'`.
 */
export async function uploadProductPhoto(id: number, file: File): Promise<Product> {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${BASE_URL}/api/products/${id}/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error ?? `Request failed (${res.status})`, json?.details);
  return json as Product;
}

/** Prefixes a backend-relative photoUrl (e.g. "/uploads/photos/x.jpg") with the API base URL so <img> can load it directly. */
export function resolveProductPhotoUrl(photoUrl: string | null | undefined): string | undefined {
  if (!photoUrl) return undefined;
  return `${BASE_URL}${photoUrl}`;
}
