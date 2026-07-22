import { create } from 'zustand';

export type NotificationType = 'signal' | 'low_stock' | 'order_late';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  /** Where clicking the notification should navigate to. */
  href: string;
}

interface NotificationState {
  notifications: AppNotification[];
  add: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const MAX_NOTIFICATIONS = 30;

// Plain in-memory store, deliberately not persisted — notifications are a
// live feed of "what just happened," sourced straight from the same
// Socket.io events every other live-updating page already listens to
// (signal:created, stock:updated). Reloading the page is "catch up by
// looking at the actual pages" (Market Signals, Products), not "lose state."
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  add: (n) =>
    set((state) => ({
      notifications: [
        { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, read: false, createdAt: new Date().toISOString() },
        ...state.notifications,
      ].slice(0, MAX_NOTIFICATIONS),
    })),
  markRead: (id) => set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllRead: () => set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
}));
