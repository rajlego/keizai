import { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useParts } from '../../hooks/useParts';
import { useCommitments } from '../../hooks/useLoans';
import { Card } from '../common';
import type { TransactionType } from '../../models/types';
import { CENTRAL_BANK_ID } from '../../models/types';

type FilterOption = 'all' | TransactionType;

// Transaction type icons and colors
const transactionMeta: Record<TransactionType, { icon: string; color: string }> = {
  task_reward: { icon: '+$', color: 'var(--color-pixel-success)' },
  transfer: { icon: '<>', color: 'var(--color-pixel-accent)' },
  bonus: { icon: '*', color: 'var(--color-pixel-warning)' },
  penalty: { icon: '-', color: 'var(--color-pixel-error)' },
};

export function HistoryView() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const transactions = useTransactions();
  const parts = useParts();
  const commitments = useCommitments();

  // Calculate achievements for positive reinforcement
  const achievements = useMemo(() => {
    const completedCommitments = commitments.filter(c => c.status === 'completed');
    const totalTasksCompleted = commitments.reduce((sum, c) =>
      sum + c.tasks.filter(t => t.isCompleted).length, 0
    );
    const totalEarned = transactions
      .filter(t => t.type === 'task_reward')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate streaks
    const sortedCompleted = [...completedCommitments].sort(
      (a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    );
    let currentStreak = 0;
    for (const c of sortedCompleted) {
      if (c.status === 'completed') currentStreak++;
      else break;
    }

    return {
      completedCommitments: completedCommitments.length,
      totalTasksCompleted,
      totalEarned,
      currentStreak,
      failedCommitments: commitments.filter(c => c.status === 'failed').length,
    };
  }, [commitments, transactions]);

  // Get name by ID (part or central bank)
  const getEntityName = (id: string): string => {
    if (id === CENTRAL_BANK_ID) return 'Central Bank';
    if (id === 'system') return 'System';
    const part = parts.find((p) => p.id === id);
    return part?.name || 'Unknown';
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filter !== 'all') {
      filtered = transactions.filter((tx) => tx.type === filter);
    }

    // Sort by most recent first
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions, filter]);

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'task_reward', label: 'Rewards' },
    { value: 'transfer', label: 'Transfers' },
    { value: 'bonus', label: 'Bonuses' },
    { value: 'penalty', label: 'Penalties' },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[18px] text-[var(--color-pixel-accent)]">
          Your Journey
        </h1>

        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className="px-3 py-2 bg-[var(--color-pixel-surface)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Achievements Section - Positive reinforcement for Inner Critic */}
      {(achievements.completedCommitments > 0 || achievements.totalTasksCompleted > 0) && (
        <Card className="mb-6 bg-gradient-to-r from-[var(--color-pixel-success)]/10 to-[var(--color-pixel-accent)]/10 border-[var(--color-pixel-success)]/30">
          <h2 className="text-[12px] text-[var(--color-pixel-success)] mb-3">
            Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[24px] text-[var(--color-pixel-success)] font-bold">
                {achievements.completedCommitments}
              </p>
              <p className="text-[8px] text-[var(--color-pixel-text-dim)]">
                Commitments Kept
              </p>
            </div>
            <div className="text-center">
              <p className="text-[24px] text-[var(--color-pixel-accent)] font-bold">
                {achievements.totalTasksCompleted}
              </p>
              <p className="text-[8px] text-[var(--color-pixel-text-dim)]">
                Tasks Done
              </p>
            </div>
            <div className="text-center">
              <p className="text-[24px] text-[var(--color-pixel-warning)] font-bold">
                ${achievements.totalEarned.toLocaleString()}
              </p>
              <p className="text-[8px] text-[var(--color-pixel-text-dim)]">
                Total Earned
              </p>
            </div>
            <div className="text-center">
              <p className="text-[24px] text-[var(--color-pixel-primary)] font-bold">
                {achievements.currentStreak}
              </p>
              <p className="text-[8px] text-[var(--color-pixel-text-dim)]">
                Current Streak
              </p>
            </div>
          </div>
          {achievements.currentStreak >= 3 && (
            <p className="text-[10px] text-[var(--color-pixel-success)] text-center mt-3">
              {achievements.currentStreak >= 5 ? 'Amazing streak! Keep it up!' : 'Great momentum!'}
            </p>
          )}
        </Card>
      )}

      {/* Transaction Count */}
      <p className="text-[10px] text-[var(--color-pixel-text-dim)] mb-4">
        Showing {filteredTransactions.length} transaction
        {filteredTransactions.length !== 1 ? 's' : ''}
      </p>

      {/* Transactions List */}
      <Card>
        {filteredTransactions.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredTransactions.map((tx) => {
              const meta = transactionMeta[tx.type] || { icon: '?', color: 'var(--color-pixel-text-dim)' };
              const fromName = getEntityName(tx.fromId);
              const toName = getEntityName(tx.toId);

              return (
                <div
                  key={tx.id}
                  className="flex items-start gap-3 p-3 bg-[var(--color-pixel-bg)] border border-[#444] hover:border-[var(--color-pixel-accent)] transition-colors"
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center border-2 text-[10px] font-bold"
                    style={{
                      borderColor: meta.color,
                      color: meta.color,
                    }}
                  >
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[var(--color-pixel-text)]">{fromName}</span>
                      <span className="text-[var(--color-pixel-text-dim)]">-&gt;</span>
                      <span className="text-[var(--color-pixel-text)]">{toName}</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-pixel-text-dim)] mt-1 truncate">
                      {tx.description}
                    </p>
                    <p className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="text-[14px] font-bold"
                      style={{ color: meta.color }}
                    >
                      ${tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[8px] text-[var(--color-pixel-text-dim)] uppercase">
                      {tx.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-[40px] mb-4 text-[var(--color-pixel-text-dim)]">$</div>
            <p className="text-[var(--color-pixel-text-dim)] text-[12px]">
              No transactions found
            </p>
            <p className="text-[var(--color-pixel-text-dim)] text-[10px] mt-1">
              Transactions will appear here as you use Keizai
            </p>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      {filteredTransactions.length > 0 && (
        <Card className="mt-4">
          <h2 className="text-[12px] text-[var(--color-pixel-accent)] mb-3">
            Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
            <div>
              <p className="text-[var(--color-pixel-text-dim)]">Total Volume</p>
              <p className="text-[var(--color-pixel-text)] font-bold">
                $
                {filteredTransactions
                  .reduce((sum, tx) => sum + tx.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-pixel-text-dim)]">Rewards Earned</p>
              <p className="text-[var(--color-pixel-success)] font-bold">
                {transactions.filter((tx) => tx.type === 'task_reward').length}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-pixel-text-dim)]">Transfers</p>
              <p className="text-[var(--color-pixel-accent)] font-bold">
                {transactions.filter((tx) => tx.type === 'transfer').length}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-pixel-text-dim)]">Penalties</p>
              <p className="text-[var(--color-pixel-error)] font-bold">
                {transactions.filter((tx) => tx.type === 'penalty').length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default HistoryView;
