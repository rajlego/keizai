import { useEffect, useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import type { View } from '../models/types';

const VIEW_KEYS: Record<string, View> = {
  '1': 'dashboard',
  '2': 'parts',
  '3': 'commitments',
  '4': 'bank',
  '5': 'history',
  '0': 'settings',
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') return true;
  if (target.isContentEditable) return true;

  return false;
}

export function useKeyboard(): void {
  const currentView = useUIStore((s) => s.currentView);
  const setView = useUIStore((s) => s.setView);
  const openCreatePartModal = useUIStore((s) => s.openCreatePartModal);
  const openNewLoanModal = useUIStore((s) => s.openNewLoanModal);
  const openTransferModal = useUIStore((s) => s.openTransferModal);
  const closeCreatePartModal = useUIStore((s) => s.closeCreatePartModal);
  const closeNewLoanModal = useUIStore((s) => s.closeNewLoanModal);
  const closeTaskModal = useUIStore((s) => s.closeTaskModal);
  const closeTransferModal = useUIStore((s) => s.closeTransferModal);
  const isCreatePartModalOpen = useUIStore((s) => s.isCreatePartModalOpen);
  const isNewLoanModalOpen = useUIStore((s) => s.isNewLoanModalOpen);
  const isTaskModalOpen = useUIStore((s) => s.isTaskModalOpen);
  const isTransferModalOpen = useUIStore((s) => s.isTransferModalOpen);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if target is editable
      if (isEditableTarget(event.target)) return;

      // Skip if modifier keys are pressed (except for specific combos)
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key;

      // Escape closes modals
      if (key === 'Escape') {
        if (isCreatePartModalOpen) {
          closeCreatePartModal();
          event.preventDefault();
          return;
        }
        if (isNewLoanModalOpen) {
          closeNewLoanModal();
          event.preventDefault();
          return;
        }
        if (isTaskModalOpen) {
          closeTaskModal();
          event.preventDefault();
          return;
        }
        if (isTransferModalOpen) {
          closeTransferModal();
          event.preventDefault();
          return;
        }
        return;
      }

      // Don't process other shortcuts if a modal is open
      if (
        isCreatePartModalOpen ||
        isNewLoanModalOpen ||
        isTaskModalOpen ||
        isTransferModalOpen
      ) {
        return;
      }

      // Number keys for view switching
      if (key in VIEW_KEYS) {
        setView(VIEW_KEYS[key]);
        event.preventDefault();
        return;
      }

      // 'n' key for creating new items
      if (key === 'n' || key === 'N') {
        if (currentView === 'parts') {
          openCreatePartModal();
          event.preventDefault();
        } else if (
          currentView === 'commitments' ||
          currentView === 'dashboard'
        ) {
          openNewLoanModal();
          event.preventDefault();
        }
        return;
      }

      // 't' key for transfer
      if (key === 't' || key === 'T') {
        openTransferModal();
        event.preventDefault();
        return;
      }
    },
    [
      currentView,
      setView,
      openCreatePartModal,
      openNewLoanModal,
      openTransferModal,
      closeCreatePartModal,
      closeNewLoanModal,
      closeTaskModal,
      closeTransferModal,
      isCreatePartModalOpen,
      isNewLoanModalOpen,
      isTaskModalOpen,
      isTransferModalOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
