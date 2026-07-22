import { create } from 'zustand';
import type { Customer } from '../types';

export type PortalAuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface PortalAuthState {
  customer: Customer | null;
  status: PortalAuthStatus;
  login: (customer: Customer) => void;
  setLoading: () => void;
  setUnauthenticated: () => void;
}

export const usePortalAuthStore = create<PortalAuthState>((set) => ({
  customer: null,
  status: 'idle',
  login: (customer) => set({ customer, status: 'authenticated' }),
  setLoading: () => set({ status: 'loading' }),
  setUnauthenticated: () => set({ customer: null, status: 'unauthenticated' }),
}));
