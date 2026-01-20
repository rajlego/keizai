import { useState, useCallback } from 'react';
import type { Part, PartPersonality, Relationship, Commitment } from '../../models/types';
import { CharacterPortrait } from './CharacterPortrait';

interface NegotiationPanelProps {
  part: Part;
  personality?: PartPersonality | null;
  relationship?: Relationship | null;
  existingCommitments: Commitment[];
  onPropose: (amount: number, terms: string, interestRate: number, durationDays: number) => void;
  onCounterOffer?: (amount: number, terms: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  currentOffer?: {
    amount: number;
    interestRate: number;
    durationDays: number;
    terms: string;
    fromPart: boolean; // true if the part proposed this
  };
  isLoading?: boolean;
}

export function NegotiationPanel({
  part,
  personality,
  relationship,
  existingCommitments,
  onPropose,
  onAccept,
  onReject,
  onClose,
  currentOffer,
  isLoading = false,
}: NegotiationPanelProps) {
  const [amount, setAmount] = useState(currentOffer?.amount ?? 100);
  const [interestRate, setInterestRate] = useState(currentOffer?.interestRate ?? 5);
  const [durationDays, setDurationDays] = useState(currentOffer?.durationDays ?? 7);
  const [terms, setTerms] = useState(currentOffer?.terms ?? '');
  const [mode, setMode] = useState<'view' | 'propose'>('view');

  // Calculate total owed (sum of pending task rewards)
  const totalOwed = existingCommitments.reduce((sum, c) => {
    const pendingRewards = c.tasks.filter(t => !t.isCompleted).reduce((s, t) => s + t.reward, 0);
    return sum + pendingRewards;
  }, 0);
  const creditUtilization = part.balance > 0 ? (totalOwed / part.balance) * 100 : 0;

  // Credit score affects max loan amount
  const maxLoanMultiplier = part.creditScore >= 700 ? 3 : part.creditScore >= 600 ? 2 : 1;
  const suggestedMax = part.balance * maxLoanMultiplier;

  // Calculate repayment
  const calculateRepayment = useCallback(() => {
    const interest = amount * (interestRate / 100);
    return amount + interest;
  }, [amount, interestRate]);

  const handlePropose = () => {
    onPropose(amount, terms, interestRate, durationDays);
    setMode('view');
  };

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <CharacterPortrait part={part} mood="neutral" size="sm" />
          <div>
            <h3 className="text-[14px] text-[var(--color-pixel-accent)] font-bold">
              Negotiation with {part.name}
            </h3>
            <div className="text-[9px] text-[var(--color-pixel-text-dim)]">
              Credit Score: {part.creditScore} • Balance: ${part.balance.toLocaleString()}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-pixel-text-dim)] hover:text-[var(--color-pixel-text)] text-lg"
        >
          ×
        </button>
      </div>

      {/* Part's financial status */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)]">
        <div className="text-center">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Balance</div>
          <div className="text-[12px] text-[var(--color-pixel-accent)]">
            ${part.balance.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Total Owed</div>
          <div className="text-[12px] text-[var(--color-pixel-warning)]">
            ${totalOwed.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Credit Use</div>
          <div className={`text-[12px] ${creditUtilization > 80 ? 'text-[var(--color-pixel-error)]' : 'text-[var(--color-pixel-success)]'}`}>
            {creditUtilization.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Current offer display */}
      {currentOffer && mode === 'view' && (
        <div className={`mb-4 p-3 border-2 ${currentOffer.fromPart ? 'border-[var(--color-pixel-warning)] bg-[var(--color-pixel-warning)]/10' : 'border-[var(--color-pixel-accent)] bg-[var(--color-pixel-accent)]/10'}`}>
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] mb-2">
            {currentOffer.fromPart ? `${part.name}'s Offer:` : 'Your Offer:'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[var(--color-pixel-text-dim)]">Amount:</span>{' '}
              <span className="text-[var(--color-pixel-accent)]">${currentOffer.amount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[var(--color-pixel-text-dim)]">Interest:</span>{' '}
              <span className="text-[var(--color-pixel-accent)]">{currentOffer.interestRate}%</span>
            </div>
            <div>
              <span className="text-[var(--color-pixel-text-dim)]">Duration:</span>{' '}
              <span className="text-[var(--color-pixel-accent)]">{currentOffer.durationDays} days</span>
            </div>
            <div>
              <span className="text-[var(--color-pixel-text-dim)]">Repay:</span>{' '}
              <span className="text-[var(--color-pixel-warning)]">
                ${(currentOffer.amount * (1 + currentOffer.interestRate / 100)).toLocaleString()}
              </span>
            </div>
          </div>
          {currentOffer.terms && (
            <div className="mt-2 text-[10px] text-[var(--color-pixel-text)]">
              "{currentOffer.terms}"
            </div>
          )}
        </div>
      )}

      {/* Proposal form */}
      {mode === 'propose' && (
        <div className="mb-4 p-3 border-2 border-[var(--color-pixel-secondary)]">
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] mb-3">Make an Offer:</div>

          <div className="space-y-3">
            <div>
              <label className="block text-[9px] text-[var(--color-pixel-text-dim)] mb-1">
                Amount (max suggested: ${suggestedMax.toLocaleString()})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-[var(--color-pixel-text-dim)] mb-1">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[9px] text-[var(--color-pixel-text-dim)] mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-[var(--color-pixel-text-dim)] mb-1">
                Terms/Notes (optional)
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Any special conditions..."
                className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] h-16 resize-none"
              />
            </div>

            <div className="text-[10px] text-[var(--color-pixel-text-dim)]">
              Total Repayment: <span className="text-[var(--color-pixel-warning)]">${calculateRepayment().toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Personality insight */}
      {personality && (
        <div className="mb-4 p-2 bg-[var(--color-pixel-bg)]/50 border border-[var(--color-pixel-secondary)] text-[9px]">
          <div className="text-[var(--color-pixel-text-dim)]">
            <span className="text-[var(--color-pixel-accent)]">{part.name}</span> {personality.speechStyle}
          </div>
          <div className="text-[var(--color-pixel-text-dim)] mt-1">
            Core need: {personality.coreNeed}
          </div>
        </div>
      )}

      {/* Relationship status */}
      {relationship && (
        <div className="mb-4 text-[9px] text-[var(--color-pixel-text-dim)]">
          Relationship: Level {relationship.level}/10 ({relationship.title})
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {mode === 'view' && (
          <>
            <button
              onClick={() => setMode('propose')}
              disabled={isLoading}
              className="px-3 py-1.5 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] hover:brightness-110 disabled:opacity-50"
            >
              {currentOffer ? 'Counter Offer' : 'Make Offer'}
            </button>
            {currentOffer && (
              <>
                <button
                  onClick={onAccept}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] bg-[var(--color-pixel-success)] text-black border-2 border-[var(--color-pixel-success)] hover:brightness-110 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={onReject}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] bg-[var(--color-pixel-error)] text-white border-2 border-[var(--color-pixel-error)] hover:brightness-110 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
          </>
        )}
        {mode === 'propose' && (
          <>
            <button
              onClick={handlePropose}
              disabled={isLoading || amount <= 0}
              className="px-3 py-1.5 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Offer'}
            </button>
            <button
              onClick={() => setMode('view')}
              disabled={isLoading}
              className="px-3 py-1.5 text-[10px] bg-transparent text-[var(--color-pixel-text)] border-2 border-[#888] hover:border-[var(--color-pixel-accent)]"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
