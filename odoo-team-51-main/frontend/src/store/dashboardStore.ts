import { create } from 'zustand';

interface DashboardMetrics {
  sales: { all: number; my: number };
  purchase: { all: number; my: number };
  manufacturing: { all: number; my: number };
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  setMetrics: (metrics: DashboardMetrics) => void;
  updateMetric: (module: keyof DashboardMetrics, type: 'all' | 'my', value: number) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
  updateMetric: (module, type, value) => set((state) => {
    if (!state.metrics) return state;
    return {
      metrics: {
        ...state.metrics,
        [module]: {
          ...state.metrics[module],
          [type]: value,
        }
      }
    };
  }),
}));
