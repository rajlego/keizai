import { useMemo } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useParts } from '../../hooks/useParts';
import { useActiveCommitments, useCommitments } from '../../hooks/useLoans';
import { useCentralBank } from '../../hooks/useCentralBank';
import { Card, Button } from '../common';
import { LoanList } from '../loans';

// Get an encouraging message based on state
function getEncouragingMessage(activeCommitments: number, completedToday: number, partsCount: number): string {
  if (partsCount === 0) {
    return "Ready to begin your journey?";
  }
  if (completedToday > 0) {
    return completedToday === 1 ? "Nice! You completed a task today!" : `Great job! ${completedToday} tasks done today!`;
  }
  if (activeCommitments === 0) {
    return "All caught up! Time to set new goals?";
  }
  if (activeCommitments === 1) {
    return "One commitment in progress. You got this!";
  }
  return `${activeCommitments} commitments active. One step at a time.`;
}

export function DashboardView() {
  const parts = useParts();
  const activeCommitments = useActiveCommitments();
  const allCommitments = useCommitments();
  const centralBank = useCentralBank();

  const setView = useUIStore((state) => state.setView);
  const openCreatePartModal = useUIStore((state) => state.openCreatePartModal);
  const openNewLoanModal = useUIStore((state) => state.openNewLoanModal);
  const openTaskModal = useUIStore((state) => state.openTaskModal);

  const totalPartsBalance = parts.reduce((sum, part) => sum + part.balance, 0);

  // Count tasks completed today
  const tasksCompletedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (const c of allCommitments) {
      for (const task of c.tasks) {
        if (task.isCompleted && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (completedDate >= today) count++;
        }
      }
    }
    return count;
  }, [allCommitments]);

  const encouragingMessage = getEncouragingMessage(activeCommitments.length, tasksCompletedToday, parts.length);

  const formatNum = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-3">
      {/* Welcome Header with Encouraging Message */}
      <div className="text-center py-2">
        <h1 className="text-sm text-[var(--color-pixel-accent)] mb-1">
          Welcome to Keizai
        </h1>
        <p className="text-[10px] text-[var(--color-pixel-text)] mb-1">
          {encouragingMessage}
        </p>
        {tasksCompletedToday > 0 && (
          <div className="inline-block px-2 py-1 bg-[var(--color-pixel-success)]/20 border border-[var(--color-pixel-success)]/30 text-[8px] text-[var(--color-pixel-success)]">
            {tasksCompletedToday} task{tasksCompletedToday !== 1 ? 's' : ''} today
          </div>
        )}
      </div>

      {/* Quick Stats Grid - 2x2 compact */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="text-center p-2">
          <p className="text-[7px] text-[var(--color-pixel-text-dim)] uppercase">Parts</p>
          <p className="text-base text-[var(--color-pixel-accent)]">{parts.length}</p>
        </Card>

        <Card className="text-center p-2">
          <p className="text-[7px] text-[var(--color-pixel-text-dim)] uppercase">Active</p>
          <p className="text-base text-[var(--color-pixel-warning)]">{activeCommitments.length}</p>
        </Card>

        <Card className="text-center p-2">
          <p className="text-[7px] text-[var(--color-pixel-text-dim)] uppercase">Bank</p>
          <p className="text-[10px] text-[var(--color-pixel-success)]">${formatNum(centralBank.balance)}</p>
        </Card>

        <Card className="text-center p-2">
          <p className="text-[7px] text-[var(--color-pixel-text-dim)] uppercase">Parts $</p>
          <p className="text-[10px] text-[var(--color-pixel-primary)]">${formatNum(totalPartsBalance)}</p>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2 justify-center">
        <Button variant="primary" size="sm" onClick={openCreatePartModal}>
          + Part
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openNewLoanModal()}
          disabled={parts.length === 0}
        >
          + Commit
        </Button>
      </div>

      {/* Active Commitments Section */}
      {activeCommitments.length > 0 && (
        <Card className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] text-[var(--color-pixel-accent)]">Active Commitments</h2>
            <Button variant="secondary" size="sm" onClick={() => setView('commitments')}>
              All
            </Button>
          </div>
          <LoanList
            commitments={activeCommitments.slice(0, 2)}
            emptyMessage="No active commitments"
            onCommitmentClick={(commitment) => openTaskModal(commitment.id)}
          />
          {activeCommitments.length > 2 && (
            <p className="text-[8px] text-[var(--color-pixel-text-dim)] text-center mt-2">
              +{activeCommitments.length - 2} more...
            </p>
          )}
        </Card>
      )}

      {/* Your Parts Section */}
      <Card className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] text-[var(--color-pixel-accent)]">Your Parts</h2>
          <Button variant="secondary" size="sm" onClick={() => setView('parts')}>
            All
          </Button>
        </div>
        {parts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {parts.slice(0, 6).map((part) => (
              <div
                key={part.id}
                className="flex items-center gap-2 p-2 bg-[var(--color-pixel-bg)] border border-[#444] cursor-pointer hover:border-[var(--color-pixel-accent)]"
                onClick={() => {
                  useUIStore.getState().selectPart(part.id);
                  setView('parts');
                }}
              >
                <div className="w-8 h-8 flex-shrink-0 border border-[#666] bg-[#222] flex items-center justify-center overflow-hidden">
                  {part.avatarUrl ? (
                    <img src={part.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-[var(--color-pixel-text-dim)]">
                      {part.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-[var(--color-pixel-text)] truncate">{part.name}</p>
                  <p className="text-[8px] text-[var(--color-pixel-success)]">${formatNum(part.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[9px] text-[var(--color-pixel-text-dim)] text-center py-4">
            No parts yet. Create one to get started!
          </p>
        )}
        {parts.length > 6 && (
          <p className="text-[8px] text-[var(--color-pixel-text-dim)] text-center mt-2">
            +{parts.length - 6} more...
          </p>
        )}
      </Card>
    </div>
  );
}

export default DashboardView;
