import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useParts } from '../../hooks/useParts';
import { usePartLoans } from '../../hooks/useLoans';
import { usePartTransactions } from '../../hooks/useTransactions';
import { Card, Button, CreditScoreBadge } from '../common';
import { PartGrid } from '../parts';
import { EditAvatarModal } from '../parts/EditAvatarModal';
import type { Part } from '../../models/types';

// Part details panel component
function PartDetailsPanel({
  part,
  onEditAvatar
}: {
  part: Part;
  onEditAvatar: () => void;
}) {
  const openNewLoanModal = useUIStore((state) => state.openNewLoanModal);
  const openTransferModal = useUIStore((state) => state.openTransferModal);

  const loans = usePartLoans(part.id);
  const transactions = usePartTransactions(part.id);

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeLoansCount = loans.filter((l) => l.status === 'active').length;

  return (
    <Card className="mt-4 p-3">
      <div className="flex items-start gap-3">
        {/* Avatar - clickable to edit */}
        <div
          className="w-14 h-14 flex-shrink-0 border-2 border-[#888] bg-[var(--color-pixel-bg)] overflow-hidden cursor-pointer hover:border-[var(--color-pixel-accent)] transition-colors relative group"
          onClick={onEditAvatar}
          title="Click to edit avatar"
        >
          {part.avatarUrl ? (
            <img
              src={part.avatarUrl}
              alt={part.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[20px] text-[var(--color-pixel-text-dim)]">
              {part.name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Edit overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-[8px] text-white">Edit</span>
          </div>
        </div>

        {/* Part Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[12px] text-[var(--color-pixel-accent)] mb-1 truncate">
            {part.name}
          </h3>
          <div className="flex items-center gap-3 text-[9px]">
            <span className="text-[var(--color-pixel-text)]">
              <span className="text-[var(--color-pixel-success)]">
                ${part.balance.toLocaleString()}
              </span>
            </span>
            <CreditScoreBadge score={part.creditScore} />
          </div>
          <p className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1">
            {activeLoansCount} active loan{activeLoansCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => openNewLoanModal(part.id)}
        >
          Loan
        </Button>
        <Button variant="secondary" size="sm" onClick={openTransferModal}>
          Transfer
        </Button>
        <Button variant="secondary" size="sm" onClick={onEditAvatar}>
          Avatar
        </Button>
      </div>

      {/* Recent Transactions */}
      <div className="mt-3">
        <h4 className="text-[9px] text-[var(--color-pixel-text-dim)] uppercase tracking-wider mb-2">
          Recent Transactions
        </h4>
        {recentTransactions.length > 0 ? (
          <div className="space-y-1">
            {recentTransactions.map((tx) => {
              const isIncoming = tx.toId === part.id;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-1 bg-[var(--color-pixel-bg)] border border-[#444] text-[8px]"
                >
                  <span className="text-[var(--color-pixel-text-dim)]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[var(--color-pixel-text)] truncate mx-2 flex-1">
                    {tx.description}
                  </span>
                  <span
                    className={
                      isIncoming
                        ? 'text-[var(--color-pixel-success)]'
                        : 'text-[var(--color-pixel-error)]'
                    }
                  >
                    {isIncoming ? '+' : '-'}${tx.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[9px] text-[var(--color-pixel-text-dim)] text-center py-2">
            No transactions yet
          </p>
        )}
      </div>
    </Card>
  );
}

export function PartsView() {
  const parts = useParts();
  const selectedPartId = useUIStore((state) => state.selectedPartId);
  const openCreatePartModal = useUIStore((state) => state.openCreatePartModal);

  const [editAvatarPartId, setEditAvatarPartId] = useState<string | null>(null);

  const selectedPart = parts.find((p) => p.id === selectedPartId);
  const editAvatarPart = parts.find((p) => p.id === editAvatarPartId);

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm text-[var(--color-pixel-accent)]">Parts</h1>
        <Button variant="primary" size="sm" onClick={openCreatePartModal}>
          + Part
        </Button>
      </div>

      {/* Parts Grid */}
      <PartGrid />

      {/* Selected Part Details */}
      {selectedPart && (
        <PartDetailsPanel
          part={selectedPart}
          onEditAvatar={() => setEditAvatarPartId(selectedPart.id)}
        />
      )}

      {/* Edit Avatar Modal */}
      {editAvatarPart && (
        <EditAvatarModal
          part={editAvatarPart}
          isOpen={!!editAvatarPartId}
          onClose={() => setEditAvatarPartId(null)}
        />
      )}
    </div>
  );
}

export default PartsView;
