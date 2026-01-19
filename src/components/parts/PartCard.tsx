import type { Part } from '../../models/types';
import { Card } from '../common/Card';
import { CreditScoreBadge } from '../common/CreditScoreBadge';

interface PartCardProps {
  part: Part;
  onClick?: () => void;
}

export function PartCard({ part, onClick }: PartCardProps) {
  return (
    <Card
      className={`
        ${onClick ? 'cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000]' : ''}
        transition-transform
      `}
    >
      <div onClick={onClick} className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 flex-shrink-0 border-2 border-[#888] bg-[var(--color-pixel-bg)] overflow-hidden">
          {part.avatarUrl ? (
            <img
              src={part.avatarUrl}
              alt={`${part.name}'s avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-pixel-accent)] text-[20px]">
              {part.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[12px] text-[var(--color-pixel-accent)] truncate mb-1">
            {part.name}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--color-pixel-text)]">
              <span className="text-[var(--color-pixel-text-dim)]">$</span>
              {part.balance.toLocaleString()}
            </span>
            <CreditScoreBadge score={part.creditScore} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PartCard;
