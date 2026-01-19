import { useState, useEffect } from 'react';
import type { Commitment, Part } from '../../models/types';
import { getPart, onPartsChange } from '../../sync/yjsProvider';
import { Card } from '../common/Card';
import { Countdown } from '../common/Countdown';

interface CommitmentCardProps {
  commitment: Commitment;
  onClick?: () => void;
}

type StatusConfig = {
  label: string;
  colorClass: string;
};

const statusConfigs: Record<Commitment['status'], StatusConfig> = {
  active: { label: 'ACTIVE', colorClass: 'bg-blue-600' },
  completed: { label: 'COMPLETED', colorClass: 'bg-green-600' },
  failed: { label: 'FAILED', colorClass: 'bg-red-600' },
};

export function LoanCard({ commitment, onClick }: CommitmentCardProps) {
  const [part, setPart] = useState<Part | undefined>(() =>
    getPart(commitment.partId)
  );

  useEffect(() => {
    const unsubscribe = onPartsChange(() => {
      setPart(getPart(commitment.partId));
    });
    return () => unsubscribe();
  }, [commitment.partId]);

  const partName = part?.name ?? 'Unknown';

  const completedTasks = commitment.tasks.filter((t) => t.isCompleted).length;
  const totalTasks = commitment.tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const totalReward = commitment.tasks.reduce((sum, t) => sum + t.reward, 0);
  const earnedReward = commitment.tasks
    .filter((t) => t.isCompleted)
    .reduce((sum, t) => sum + t.reward, 0);

  const statusConfig = statusConfigs[commitment.status];

  return (
    <Card
      className={`
        ${onClick ? 'cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000]' : ''}
        transition-transform
      `}
    >
      <div onClick={onClick} className="space-y-3">
        {/* Header with status badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {/* Small avatar */}
            {part?.avatarUrl && (
              <div className="w-6 h-6 border border-[#666] overflow-hidden">
                <img src={part.avatarUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-[10px] text-[var(--color-pixel-accent)]">
              {partName}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-[8px] text-white ${statusConfig.colorClass} border border-white/20`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        {commitment.description && (
          <p className="text-[10px] text-[var(--color-pixel-text)] truncate">
            {commitment.description}
          </p>
        )}

        {/* Reward Info */}
        <div className="flex items-baseline gap-3">
          <span className="text-[9px] text-[var(--color-pixel-text-dim)]">
            Earned: <span className="text-[var(--color-pixel-success)]">${earnedReward}</span>
          </span>
          <span className="text-[9px] text-[var(--color-pixel-text-dim)]">
            / Total: <span className="text-[var(--color-pixel-accent)]">${totalReward}</span>
          </span>
        </div>

        {/* Task Progress */}
        {totalTasks > 0 && (
          <div>
            <div className="flex justify-between text-[8px] text-[var(--color-pixel-text-dim)] mb-1">
              <span>Tasks</span>
              <span>
                {completedTasks}/{totalTasks}
              </span>
            </div>
            <div className="progress-pixel w-full">
              <div
                className="h-full bg-gradient-to-b from-green-400 to-green-600"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Deadline Countdown */}
        {commitment.status === 'active' && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--color-pixel-text-dim)]">Deadline:</span>
            <Countdown deadline={commitment.deadline} />
          </div>
        )}

        {/* Completed date */}
        {commitment.status === 'completed' && commitment.completedAt && (
          <p className="text-[8px] text-[var(--color-pixel-success)]">
            Completed on {new Date(commitment.completedAt).toLocaleDateString()}
          </p>
        )}
        {commitment.status === 'failed' && commitment.failedAt && (
          <p className="text-[8px] text-[var(--color-pixel-error)]">
            Failed on {new Date(commitment.failedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  );
}

// Legacy alias
export const CommitmentCard = LoanCard;
export default LoanCard;
