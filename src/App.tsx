import { useEffect } from 'react';
import { useUIStore } from './store/uiStore';
import { useKeyboard } from './hooks/useKeyboard';
import { useNotification } from './hooks/useNotification';
import { initLocalPersistence } from './sync/yjsProvider';
import { regenerateBankFunds } from './services/centralBank';
import { startDeadlineChecker } from './services/deadlines';
import {
  DashboardView,
  PartsView,
  LoansView,
  BankView,
  HistoryView,
  SettingsView,
} from './components/views';
import { CreatePartModal } from './components/parts/CreatePartModal';
import { NewLoanModal, TaskModal } from './components/loans';
import { TransferModal } from './components/common/TransferModal';
import type { View } from './models/types';

const NAV_ITEMS: { view: View; label: string; key: string }[] = [
  { view: 'dashboard', label: 'Home', key: '1' },
  { view: 'parts', label: 'Parts', key: '2' },
  { view: 'commitments', label: 'Commits', key: '3' },
  { view: 'bank', label: 'Bank', key: '4' },
  { view: 'history', label: 'Log', key: '5' },
  { view: 'settings', label: 'Cfg', key: '0' },
];

function App() {
  const currentView = useUIStore((s) => s.currentView);
  const setView = useUIStore((s) => s.setView);
  const isInitialized = useUIStore((s) => s.isInitialized);
  const setInitialized = useUIStore((s) => s.setInitialized);
  const isCreatePartModalOpen = useUIStore((s) => s.isCreatePartModalOpen);
  const isNewLoanModalOpen = useUIStore((s) => s.isNewLoanModalOpen);
  const isTaskModalOpen = useUIStore((s) => s.isTaskModalOpen);
  const isTransferModalOpen = useUIStore((s) => s.isTransferModalOpen);
  const closeTransferModal = useUIStore((s) => s.closeTransferModal);

  // Initialize keyboard shortcuts
  useKeyboard();

  // Request notification permission
  const { requestNotificationPermission } = useNotification();

  // Initialize app
  useEffect(() => {
    let stopDeadlineChecker: (() => void) | null = null;

    async function init() {
      try {
        await initLocalPersistence();
        regenerateBankFunds();
        await requestNotificationPermission();

        // Start deadline checker
        stopDeadlineChecker = startDeadlineChecker();

        setInitialized(true);
        console.log('[Keizai] App initialized');
      } catch (error) {
        console.error('[Keizai] Initialization error:', error);
        setInitialized(true);
      }
    }
    init();

    return () => {
      if (stopDeadlineChecker) {
        stopDeadlineChecker();
      }
    };
  }, [setInitialized, requestNotificationPermission]);

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-pixel-bg)]">
        <div className="text-center">
          <h1 className="text-lg text-[var(--color-pixel-primary)] mb-2">KEIZAI</h1>
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  function renderView() {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'parts': return <PartsView />;
      case 'commitments': return <LoansView />;
      case 'bank': return <BankView />;
      case 'history': return <HistoryView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-pixel-bg)] overflow-hidden">
      {/* Compact Header */}
      <header className="flex-shrink-0 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] px-2 py-1">
        <div className="flex items-center justify-between">
          <h1
            className="text-sm text-[var(--color-pixel-primary)] cursor-pointer hover:text-[var(--color-pixel-accent)]"
            onClick={() => setView('dashboard')}
          >
            KEIZAI
          </h1>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`px-2 py-1 text-[9px] transition-colors ${
                  currentView === item.view
                    ? 'text-[var(--color-pixel-accent)] bg-[var(--color-pixel-secondary)]'
                    : 'text-[var(--color-pixel-text-dim)] hover:text-[var(--color-pixel-text)]'
                }`}
                title={`[${item.key}]`}
              >
                <span className="text-[7px] text-[var(--color-pixel-text-dim)] mr-1">{item.key}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-auto">
        <div className="p-2">{renderView()}</div>
      </main>

      {/* Compact Footer */}
      <footer className="flex-shrink-0 border-t-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] py-1 px-2">
        <div className="flex justify-between items-center text-[8px] text-[var(--color-pixel-text-dim)]">
          <span>IFS Economy</span>
          <span>[n] new • [t] transfer • [Esc] close</span>
        </div>
      </footer>

      {/* Global Modals */}
      {isCreatePartModalOpen && <CreatePartModal />}
      {isNewLoanModalOpen && <NewLoanModal />}
      {isTaskModalOpen && <TaskModal />}
      {isTransferModalOpen && (
        <TransferModal isOpen={isTransferModalOpen} onClose={closeTransferModal} />
      )}
    </div>
  );
}

export default App;
