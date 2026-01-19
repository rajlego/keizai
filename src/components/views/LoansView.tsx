import { useState, useMemo } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useCommitments } from '../../hooks/useLoans';
import { useParts } from '../../hooks/useParts';
import { Card, Button } from '../common';
import { LoanList, NewLoanModal, TaskModal } from '../loans';
import type { CommitmentStatus } from '../../models/types';

type FilterTab = 'all' | CommitmentStatus;

export function LoansView() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const commitments = useCommitments();
  const parts = useParts();

  const isNewLoanModalOpen = useUIStore((state) => state.isNewLoanModalOpen);
  const isTaskModalOpen = useUIStore((state) => state.isTaskModalOpen);
  const openNewLoanModal = useUIStore((state) => state.openNewLoanModal);
  const openTaskModal = useUIStore((state) => state.openTaskModal);

  // Filter commitments based on active tab
  const filteredCommitments = useMemo(() => {
    if (activeFilter === 'all') return commitments;
    return commitments.filter((c) => c.status === activeFilter);
  }, [commitments, activeFilter]);

  // Sort by most recent first
  const sortedCommitments = useMemo(() => {
    return [...filteredCommitments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredCommitments]);

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
    { key: 'failed', label: 'Failed' },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[18px] text-[var(--color-pixel-accent)]">Commitments</h1>
        <Button
          variant="primary"
          onClick={() => openNewLoanModal()}
          disabled={parts.length === 0}
        >
          + New Commitment
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`
              px-3 py-1 text-[10px] border-2 transition-colors
              ${
                activeFilter === tab.key
                  ? 'bg-[var(--color-pixel-accent)] border-[var(--color-pixel-accent)] text-black'
                  : 'bg-transparent border-[#888] text-[var(--color-pixel-text)] hover:border-[var(--color-pixel-accent)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Commitments List */}
      <Card>
        <LoanList
          commitments={sortedCommitments}
          emptyMessage={`No ${activeFilter === 'all' ? '' : activeFilter + ' '}commitments found`}
          onCommitmentClick={(commitment) => openTaskModal(commitment.id)}
        />
      </Card>

      {/* Modals */}
      {isNewLoanModalOpen && <NewLoanModal />}
      {isTaskModalOpen && <TaskModal />}
    </div>
  );
}

export default LoansView;
