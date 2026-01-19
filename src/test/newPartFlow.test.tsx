import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { CreatePartModal } from '../components/parts/CreatePartModal';
import { Button } from '../components/common/Button';

// Mock the yjsProvider
vi.mock('../sync/yjsProvider', () => ({
  addPart: vi.fn(),
  getAllParts: vi.fn().mockReturnValue([]),
  onPartsChange: vi.fn().mockReturnValue(() => {}),
}));

describe('New Part Flow', () => {
  beforeEach(() => {
    // Reset stores
    useUIStore.setState({
      currentView: 'dashboard',
      selectedPartId: null,
      isCreatePartModalOpen: false,
      isNewLoanModalOpen: false,
      isTaskModalOpen: false,
      taskModalLoanId: null,
      isTransferModalOpen: false,
      isGeneratingAvatar: false,
      isInitialized: true,
      loanModalBorrowerId: null,
    });

    useSettingsStore.setState({
      startingBalance: 1000,
      startingCreditScore: 650,
      notificationsEnabled: true,
      aggressiveNotifications: true,
      theme: 'pixel',
      cloudSyncEnabled: false,
    });
  });

  describe('Button opens modal', () => {
    it('clicking New Part button should open the CreatePartModal', async () => {
      const user = userEvent.setup();

      // Render a button that opens the modal (simulating Dashboard)
      function TestComponent() {
        const openModal = useUIStore((s) => s.openCreatePartModal);
        const isOpen = useUIStore((s) => s.isCreatePartModalOpen);

        return (
          <div>
            <Button onClick={openModal}>+ New Part</Button>
            {isOpen && <CreatePartModal />}
          </div>
        );
      }

      render(<TestComponent />);

      // Verify modal is not visible initially
      expect(screen.queryByText('Create New Part')).not.toBeInTheDocument();

      // Click the button
      await user.click(screen.getByText('+ New Part'));

      // Modal should now be visible
      expect(screen.getByText('Create New Part')).toBeInTheDocument();
    });

    it('modal state should update when openCreatePartModal is called', () => {
      expect(useUIStore.getState().isCreatePartModalOpen).toBe(false);

      useUIStore.getState().openCreatePartModal();

      expect(useUIStore.getState().isCreatePartModalOpen).toBe(true);
    });
  });

  describe('CreatePartModal functionality', () => {
    beforeEach(() => {
      useUIStore.setState({ isCreatePartModalOpen: true });
    });

    it('renders modal with required fields', () => {
      render(<CreatePartModal />);

      expect(screen.getByText('Create New Part')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter part name...')).toBeInTheDocument();
      expect(screen.getByText('Create Part')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('Create Part button should be disabled when name is empty', () => {
      render(<CreatePartModal />);

      const createButton = screen.getByText('Create Part');
      expect(createButton).toBeDisabled();
    });

    it('Create Part button should be enabled when name is entered', async () => {
      const user = userEvent.setup();
      render(<CreatePartModal />);

      const nameInput = screen.getByPlaceholderText('Enter part name...');
      await user.type(nameInput, 'Test Part');

      const createButton = screen.getByText('Create Part');
      expect(createButton).not.toBeDisabled();
    });

    it('Cancel button should close the modal', async () => {
      const user = userEvent.setup();
      render(<CreatePartModal />);

      await user.click(screen.getByText('Cancel'));

      expect(useUIStore.getState().isCreatePartModalOpen).toBe(false);
    });

    it('shows starting balance and credit score info', () => {
      render(<CreatePartModal />);

      expect(screen.getByText(/Starting Balance: \$1,000/)).toBeInTheDocument();
      expect(screen.getByText(/Starting Credit Score: 650/)).toBeInTheDocument();
    });
  });

  describe('Modal renders globally in App', () => {
    it('modal should be accessible from any view when isCreatePartModalOpen is true', () => {
      // Set modal to open
      useUIStore.setState({ isCreatePartModalOpen: true });

      // Render just the modal component (simulating App's global modal rendering)
      render(<CreatePartModal />);

      // Modal should be visible
      expect(screen.getByText('Create New Part')).toBeInTheDocument();
    });
  });
});
