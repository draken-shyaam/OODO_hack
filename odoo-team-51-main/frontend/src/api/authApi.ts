import { apiFetch } from './client';
import type { User, Customer } from '../types';

// None of these return a token anymore — the backend sets/clears an
// HttpOnly session cookie itself (Set-Cookie on login/signup, cleared on
// logout). The browser attaches it automatically on every subsequent
// request via `credentials: 'include'` in apiFetch.

export function login(loginId: string, password: string) {
  return apiFetch<{ user: User }>('/api/auth/login', { method: 'POST', body: { loginId, password } });
}

export function signup(loginId: string, email: string, password: string) {
  return apiFetch<{ user: User }>('/api/auth/signup', { method: 'POST', body: { loginId, email, password } });
}

export function logout() {
  return apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
}

export function forgotPassword(identifier: string) {
  return apiFetch<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: { identifier } });
}

export function resetPassword(token: string, password: string) {
  return apiFetch<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: { token, password } });
}

export function portalLogin(email: string, password: string) {
  return apiFetch<{ customer: Customer }>('/api/portal/auth/login', { method: 'POST', body: { email, password } });
}

export function portalSignup(name: string, email: string, password: string) {
  return apiFetch<{ customer: Customer }>('/api/portal/auth/signup', { method: 'POST', body: { name, email, password } });
}

export function portalLogout() {
  return apiFetch<{ message: string }>('/api/portal/auth/logout', { method: 'POST', portal: true });
}
