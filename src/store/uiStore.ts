import { create } from 'zustand';
import type { View } from '../models/types';

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  duration?: number;
}

interface UIState {
  // Navigation
  currentView: View;
  setView: (view: View) => void;

  // Part selection
  selectedPartId: string | null;
  selectPart: (partId: string | null) => void;

  // Toast notifications
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;

  // Modal states
  isCreatePartModalOpen: boolean;
  openCreatePartModal: () => void;
  closeCreatePartModal: () => void;

  isNewLoanModalOpen: boolean;
  loanModalBorrowerId: string | null;
  openNewLoanModal: (borrowerId?: string) => void;
  closeNewLoanModal: () => void;

  isTaskModalOpen: boolean;
  taskModalLoanId: string | null;
  openTaskModal: (loanId: string) => void;
  closeTaskModal: () => void;

  isTransferModalOpen: boolean;
  openTransferModal: () => void;
  closeTransferModal: () => void;

  // Loading states
  isGeneratingAvatar: boolean;
  setGeneratingAvatar: (loading: boolean) => void;

  // App initialization
  isInitialized: boolean;
  setInitialized: (initialized: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Navigation
  currentView: 'dashboard',
  setView: (view) => set({ currentView: view }),

  // Part selection
  selectedPartId: null,
  selectPart: (partId) => set({ selectedPartId: partId }),

  // Toast notifications
  toasts: [],
  showToast: (message, type = 'info', duration = 5000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toast: Toast = { id, message, type, duration };
    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }
  },
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  // Create Part Modal
  isCreatePartModalOpen: false,
  openCreatePartModal: () => set({ isCreatePartModalOpen: true }),
  closeCreatePartModal: () => set({ isCreatePartModalOpen: false }),

  // New Loan Modal
  isNewLoanModalOpen: false,
  loanModalBorrowerId: null,
  openNewLoanModal: (borrowerId) =>
    set({ isNewLoanModalOpen: true, loanModalBorrowerId: borrowerId ?? null }),
  closeNewLoanModal: () =>
    set({ isNewLoanModalOpen: false, loanModalBorrowerId: null }),

  // Task Modal
  isTaskModalOpen: false,
  taskModalLoanId: null,
  openTaskModal: (loanId) =>
    set({ isTaskModalOpen: true, taskModalLoanId: loanId }),
  closeTaskModal: () =>
    set({ isTaskModalOpen: false, taskModalLoanId: null }),

  // Transfer Modal
  isTransferModalOpen: false,
  openTransferModal: () => set({ isTransferModalOpen: true }),
  closeTransferModal: () => set({ isTransferModalOpen: false }),

  // Loading states
  isGeneratingAvatar: false,
  setGeneratingAvatar: (loading) => set({ isGeneratingAvatar: loading }),

  // App initialization
  isInitialized: false,
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));
