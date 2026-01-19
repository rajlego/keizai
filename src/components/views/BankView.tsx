import { useState, useEffect, useMemo } from 'react';
import { useCentralBank } from '../../hooks/useCentralBank';
import { useCommitments } from '../../hooks/useLoans';
import { useSettingsStore } from '../../store/settingsStore';
import { useUIStore } from '../../store/uiStore';
import { Card, Button } from '../common';
import { LoanList } from '../loans';
import { CENTRAL_BANK_ID } from '../../models/types';

export function BankView() {
  const centralBank = useCentralBank();
  const commitments = useCommitments();
  const centralBankRegenRate = useSettingsStore((state) => state.centralBankRegenRate);
  const openTaskModal = useUIStore((state) => state.openTaskModal);
  const openTransferModal = useUIStore((state) => state.openTransferModal);

  // Time until next regeneration
  const [timeUntilRegen, setTimeUntilRegen] = useState<string>('');

  useEffect(() => {
    const calculateTimeUntilRegen = () => {
      const lastRegen = new Date(centralBank.lastRegenAt);
      const nextRegen = new Date(lastRegen.getTime() + 60 * 60 * 1000); // 1 hour later
      const now = new Date();
      const diff = nextRegen.getTime() - now.getTime();

      if (diff <= 0) {
        return 'Regenerating...';
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${minutes}m ${seconds}s`;
    };

    setTimeUntilRegen(calculateTimeUntilRegen());

    const interval = setInterval(() => {
      setTimeUntilRegen(calculateTimeUntilRegen());
    }, 1000);

    return () => clearInterval(interval);
  }, [centralBank.lastRegenAt]);

  // Get commitments funded by central bank
  const bankFundedCommitments = useMemo(() => {
    return commitments.filter((c) => c.funderId === CENTRAL_BANK_ID);
  }, [commitments]);

  const activeCommitments = useMemo(() => {
    return bankFundedCommitments.filter((c) => c.status === 'active');
  }, [bankFundedCommitments]);

  // Calculate total potential rewards (outstanding)
  const totalPotentialRewards = useMemo(() => {
    return activeCommitments.reduce((sum, c) => {
      const uncommpleted = c.tasks.filter((t) => !t.isCompleted);
      return sum + uncommpleted.reduce((s, t) => s + t.reward, 0);
    }, 0);
  }, [activeCommitments]);

  // Calculate total rewards paid
  const totalRewardsPaid = useMemo(() => {
    return bankFundedCommitments.reduce((sum, c) => {
      const completed = c.tasks.filter((t) => t.isCompleted);
      return sum + completed.reduce((s, t) => s + t.reward, 0);
    }, 0);
  }, [bankFundedCommitments]);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] text-[var(--color-pixel-accent)] mb-1">
            Central Bank
          </h1>
          <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
            Funds rewards for completed commitments
          </p>
        </div>
        <Button onClick={openTransferModal} size="sm">
          <span className="text-[8px] text-[var(--color-pixel-text-dim)] mr-1">[t]</span>
          Transfer
        </Button>
      </div>

      {/* Large Balance Display */}
      <Card className="text-center py-8">
        <p className="text-[10px] text-[var(--color-pixel-text-dim)] uppercase tracking-wider mb-2">
          Current Balance
        </p>
        <p className="text-[48px] text-[var(--color-pixel-success)] font-bold leading-none">
          ${centralBank.balance.toLocaleString()}
        </p>
        <div className="mt-4 pt-4 border-t border-[#444]">
          <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
            Funds regenerate at{' '}
            <span className="text-[var(--color-pixel-accent)]">
              {centralBankRegenRate} credits/hour
            </span>
          </p>
          <p className="text-[12px] text-[var(--color-pixel-warning)] mt-2">
            Next regeneration in: {timeUntilRegen}
          </p>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-[8px] text-[var(--color-pixel-text-dim)] uppercase tracking-wider">
            Total Supply
          </p>
          <p className="text-[18px] text-[var(--color-pixel-accent)] font-bold">
            ${centralBank.totalMoneySupply.toLocaleString()}
          </p>
        </Card>

        <Card className="text-center">
          <p className="text-[8px] text-[var(--color-pixel-text-dim)] uppercase tracking-wider">
            Active Commits
          </p>
          <p className="text-[18px] text-[var(--color-pixel-warning)] font-bold">
            {activeCommitments.length}
          </p>
        </Card>

        <Card className="text-center">
          <p className="text-[8px] text-[var(--color-pixel-text-dim)] uppercase tracking-wider">
            Pending Rewards
          </p>
          <p className="text-[18px] text-[var(--color-pixel-secondary)] font-bold">
            ${totalPotentialRewards.toLocaleString()}
          </p>
        </Card>

        <Card className="text-center">
          <p className="text-[8px] text-[var(--color-pixel-text-dim)] uppercase tracking-wider">
            Rewards Paid
          </p>
          <p className="text-[18px] text-[var(--color-pixel-success)] font-bold">
            ${totalRewardsPaid.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <h2 className="text-[12px] text-[var(--color-pixel-accent)] mb-3">
          How Commitments Work
        </h2>
        <div className="text-[10px] text-[var(--color-pixel-text-dim)] space-y-2">
          <p>
            Parts make commitments to complete tasks. When a task is completed,
            the Central Bank pays the reward immediately.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <span className="text-[var(--color-pixel-success)]">Complete tasks</span> → Earn rewards
            </li>
            <li>
              <span className="text-[var(--color-pixel-warning)]">Meet deadlines</span> → Build credit score
            </li>
            <li>
              <span className="text-[var(--color-pixel-error)]">Miss deadlines</span> → Lose credit score
            </li>
          </ul>
        </div>
      </Card>

      {/* Active Commitments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] text-[var(--color-pixel-accent)]">
            Active Commitments
          </h2>
          <span className="text-[10px] text-[var(--color-pixel-text-dim)]">
            {activeCommitments.length} active
          </span>
        </div>
        <LoanList
          commitments={activeCommitments}
          emptyMessage="No active commitments"
          onCommitmentClick={(c) => openTaskModal(c.id)}
        />
      </Card>

      {/* Stats History */}
      {bankFundedCommitments.length > activeCommitments.length && (
        <Card>
          <h2 className="text-[14px] text-[var(--color-pixel-accent)] mb-4">
            Commitment History
          </h2>
          <div className="text-[10px] space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--color-pixel-text-dim)]">Total commitments:</span>
              <span className="text-[var(--color-pixel-text)]">{bankFundedCommitments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-pixel-text-dim)]">Completed:</span>
              <span className="text-[var(--color-pixel-success)]">
                {bankFundedCommitments.filter((c) => c.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-pixel-text-dim)]">Failed:</span>
              <span className="text-[var(--color-pixel-error)]">
                {bankFundedCommitments.filter((c) => c.status === 'failed').length}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default BankView;
