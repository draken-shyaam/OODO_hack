import { create } from 'zustand';

// Generic draft line shape — Sales/Purchase/Manufacturing each have their
// own typed line shape in types/index.ts; this store is a generic scratch
// pad usable across all three while a new order is being composed client-side.
interface OrderLine {
  productId: number;
  orderedQty: number;
  unitPrice: number;
}

interface DraftOrderState {
  currentDraft: any | null; // Can be typed specifically based on Sales/Purchase/Mfg
  lines: OrderLine[];
  setDraft: (draft: any) => void;
  updateDraftField: (field: string, value: any) => void;
  addLine: (line: OrderLine) => void;
  removeLine: (index: number) => void;
  updateLine: (index: number, line: OrderLine) => void;
  clearDraft: () => void;
}

export const useDraftOrderStore = create<DraftOrderState>((set) => ({
  currentDraft: null,
  lines: [],
  setDraft: (draft) => set({ currentDraft: draft, lines: draft.lines || [] }),
  updateDraftField: (field, value) => set((state) => ({ 
    currentDraft: { ...state.currentDraft, [field]: value } 
  })),
  addLine: (line) => set((state) => ({ lines: [...state.lines, line] })),
  removeLine: (index) => set((state) => ({ 
    lines: state.lines.filter((_, i) => i !== index) 
  })),
  updateLine: (index, updatedLine) => set((state) => {
    const newLines = [...state.lines];
    newLines[index] = updatedLine;
    return { lines: newLines };
  }),
  clearDraft: () => set({ currentDraft: null, lines: [] }),
}));
