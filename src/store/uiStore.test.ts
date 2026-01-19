import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      currentView: 'dashboard',
      selectedPartId: null,
      isCreatePartModalOpen: false,
      isNewLoanModalOpen: false,
      isTaskModalOpen: false,
      taskModalLoanId: null,
      isTransferModalOpen: false,
      isGeneratingAvatar: false,
      isInitialized: false,
      loanModalBorrowerId: null,
    });
  });

  describe('view navigation', () => {
    it('should start with dashboard view', () => {
      const state = useUIStore.getState();
      expect(state.currentView).toBe('dashboard');
    });

    it('should change view when setView is called', () => {
      useUIStore.getState().setView('parts');
      expect(useUIStore.getState().currentView).toBe('parts');
    });

    it('should navigate through all views', () => {
      const views = ['dashboard', 'parts', 'commitments', 'bank', 'history', 'settings'] as const;
      views.forEach((view) => {
        useUIStore.getState().setView(view);
        expect(useUIStore.getState().currentView).toBe(view);
      });
    });
  });

  describe('Create Part Modal', () => {
    it('should start with modal closed', () => {
      expect(useUIStore.getState().isCreatePartModalOpen).toBe(false);
    });

    it('should open modal when openCreatePartModal is called', () => {
      useUIStore.getState().openCreatePartModal();
      expect(useUIStore.getState().isCreatePartModalOpen).toBe(true);
    });

    it('should close modal when closeCreatePartModal is called', () => {
      useUIStore.getState().openCreatePartModal();
      expect(useUIStore.getState().isCreatePartModalOpen).toBe(true);

      useUIStore.getState().closeCreatePartModal();
      expect(useUIStore.getState().isCreatePartModalOpen).toBe(false);
    });
  });

  describe('New Loan Modal', () => {
    it('should start with modal closed', () => {
      expect(useUIStore.getState().isNewLoanModalOpen).toBe(false);
    });

    it('should open modal without borrower ID', () => {
      useUIStore.getState().openNewLoanModal();
      expect(useUIStore.getState().isNewLoanModalOpen).toBe(true);
      expect(useUIStore.getState().loanModalBorrowerId).toBe(null);
    });

    it('should open modal with borrower ID', () => {
      useUIStore.getState().openNewLoanModal('test-part-id');
      expect(useUIStore.getState().isNewLoanModalOpen).toBe(true);
      expect(useUIStore.getState().loanModalBorrowerId).toBe('test-part-id');
    });

    it('should close modal and reset borrower ID', () => {
      useUIStore.getState().openNewLoanModal('test-part-id');
      useUIStore.getState().closeNewLoanModal();

      expect(useUIStore.getState().isNewLoanModalOpen).toBe(false);
      expect(useUIStore.getState().loanModalBorrowerId).toBe(null);
    });
  });

  describe('Task Modal', () => {
    it('should open with loan ID', () => {
      useUIStore.getState().openTaskModal('loan-123');

      expect(useUIStore.getState().isTaskModalOpen).toBe(true);
      expect(useUIStore.getState().taskModalLoanId).toBe('loan-123');
    });

    it('should close and reset loan ID', () => {
      useUIStore.getState().openTaskModal('loan-123');
      useUIStore.getState().closeTaskModal();

      expect(useUIStore.getState().isTaskModalOpen).toBe(false);
      expect(useUIStore.getState().taskModalLoanId).toBe(null);
    });
  });

  describe('part selection', () => {
    it('should start with no part selected', () => {
      expect(useUIStore.getState().selectedPartId).toBe(null);
    });

    it('should select a part', () => {
      useUIStore.getState().selectPart('part-123');
      expect(useUIStore.getState().selectedPartId).toBe('part-123');
    });

    it('should deselect a part', () => {
      useUIStore.getState().selectPart('part-123');
      useUIStore.getState().selectPart(null);
      expect(useUIStore.getState().selectedPartId).toBe(null);
    });
  });

  describe('initialization', () => {
    it('should start uninitialized', () => {
      expect(useUIStore.getState().isInitialized).toBe(false);
    });

    it('should set initialized', () => {
      useUIStore.getState().setInitialized(true);
      expect(useUIStore.getState().isInitialized).toBe(true);
    });
  });
});
