import { apiFetch, ApiError } from './client';
import type { User, Permission } from '../types';

export function listUsers() {
  return apiFetch<Omit<User, 'permissions'>[]>('/api/users');
}

export function getUser(id: number) {
  return apiFetch<User>(`/api/users/${id}`);
}

export function createUser(data: { loginId: string; email: string; password: string; name: string; position?: string; isAdmin?: boolean }) {
  return apiFetch<User>('/api/users', { method: 'POST', body: data });
}

export function updateUser(id: number, data: Partial<{ name: string; address: string; mobile: string; position: string; isAdmin: boolean; permissions: Permission[] }>) {
  return apiFetch<User>(`/api/users/${id}`, { method: 'PATCH', body: data });
}

export function getMe() {
  return apiFetch<User>('/api/me');
}

export function updateMe(data: Partial<{ name: string; address: string; mobile: string }>) {
  return apiFetch<User>('/api/me', { method: 'PATCH', body: data });
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Bypasses apiFetch — that wrapper always JSON.stringifies the body and sets
 * Content-Type: application/json, which would corrupt a multipart upload.
 * The browser must set its own Content-Type (with the multipart boundary)
 * for FormData, so this builds the request by hand instead. The session
 * cookie still needs `credentials: 'include'` here since this bypasses
 * apiFetch entirely.
 */
export async function uploadMyPhoto(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${BASE_URL}/api/me/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error ?? `Request failed (${res.status})`, json?.details);
  return json as User;
}

/** Prefixes a backend-relative photoUrl (e.g. "/uploads/photos/x.jpg") with the API base URL so <img> can load it directly. */
export function resolvePhotoUrl(photoUrl: string | null | undefined): string | undefined {
  if (!photoUrl) return undefined;
  return `${BASE_URL}${photoUrl}`;
}
