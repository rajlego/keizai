import type { Commitment } from '../../models/types';
import { LoanCard } from './LoanCard';

interface CommitmentListProps {
  commitments: Commitment[];
  emptyMessage?: string;
  onCommitmentClick?: (commitment: Commitment) => void;
}

export function LoanList({
  commitments,
  emptyMessage = 'No commitments found',
  onCommitmentClick,
}: CommitmentListProps) {
  if (commitments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-[32px] mb-2 text-[var(--color-pixel-text-dim)]">*</div>
        <p className="text-[var(--color-pixel-text-dim)] text-[12px]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {commitments.map((commitment) => (
        <LoanCard
          key={commitment.id}
          commitment={commitment}
          onClick={onCommitmentClick ? () => onCommitmentClick(commitment) : undefined}
        />
      ))}
    </div>
  );
}

// Legacy alias
export const CommitmentList = LoanList;
export default LoanList;
