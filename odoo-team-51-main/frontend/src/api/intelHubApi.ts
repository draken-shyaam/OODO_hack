import { apiFetch, buildQuery } from './client';
import type { IntelPost, IntelPostType, IntelHubAuthor, IntelHubNotificationState } from '../types';

export function listIntelPosts(params?: { search?: string; postType?: string; status?: string }) {
  return apiFetch<IntelPost[]>(`/api/intel-hub${buildQuery(params ?? {})}`);
}

export function getIntelPost(id: number) {
  return apiFetch<IntelPost>(`/api/intel-hub/${id}`);
}

export function createIntelPost(data: {
  title: string;
  description: string;
  postType: IntelPostType;
  materialName: string;
  supplierName: string;
  location?: string;
  price?: number;
  quantity?: number;
  contactInfo?: string;
  expiresAt?: string;
}) {
  return apiFetch<IntelPost>('/api/intel-hub', { method: 'POST', body: data });
}

export function verifyIntelPost(id: number, starsAwarded: number) {
  return apiFetch<IntelPost>(`/api/intel-hub/${id}/verify`, { method: 'POST', body: { starsAwarded } });
}

export function rejectIntelPost(id: number) {
  return apiFetch<IntelPost>(`/api/intel-hub/${id}/reject`, { method: 'POST' });
}

export function getIntelHubLeaderboard() {
  return apiFetch<IntelHubAuthor[]>('/api/intel-hub/leaderboard');
}

export function getIntelHubNotifications() {
  return apiFetch<IntelHubNotificationState>('/api/intel-hub/notifications');
}

export function markIntelHubViewed() {
  return apiFetch<void>('/api/intel-hub/mark-viewed', { method: 'POST' });
}
