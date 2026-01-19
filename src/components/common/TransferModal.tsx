import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  getAllParts,
  getPart,
  updatePart,
  addTransaction,
  onPartsChange,
} from '../../sync/yjsProvider';
import type { Part, Transaction } from '../../models/types';

// Simple ID generator
function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFromPartId?: string;
}

export function TransferModal({ isOpen, onClose, preselectedFromPartId }: TransferModalProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [fromPartId, setFromPartId] = useState<string>('');
  const [toPartId, setToPartId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Load parts
  useEffect(() => {
    setParts(getAllParts());
    const unsubscribe = onPartsChange((updatedParts) => {
      setParts(updatedParts);
    });
    return () => unsubscribe();
  }, []);

  // Set preselected source part when modal opens
  useEffect(() => {
    if (isOpen && preselectedFromPartId) {
      setFromPartId(preselectedFromPartId);
    }
  }, [isOpen, preselectedFromPartId]);

  // Get current source part balance for validation display
  const sourcePart = fromPartId ? getPart(fromPartId) : undefined;
  const sourceBalance = sourcePart?.balance ?? 0;

  // Handle transfer
  const handleTransfer = () => {
    // Validation
    if (!fromPartId) {
      setError('Please select a source part');
      return;
    }
    if (!toPartId) {
      setError('Please select a destination part');
      return;
    }
    if (fromPartId === toPartId) {
      setError('Source and destination must be different');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const source = getPart(fromPartId);
    const destination = getPart(toPartId);

    if (!source) {
      setError('Source part not found');
      return;
    }
    if (!destination) {
      setError('Destination part not found');
      return;
    }
    if (source.balance < amount) {
      setError(`Insufficient balance. ${source.name} only has $${source.balance.toLocaleString()}`);
      return;
    }

    // Perform the transfer
    const now = new Date().toISOString();

    // Deduct from source
    updatePart(fromPartId, {
      balance: source.balance - amount,
    });

    // Add to destination
    updatePart(toPartId, {
      balance: destination.balance + amount,
    });

    // Create transaction record
    const transaction: Transaction = {
      id: generateId('txn'),
      fromId: fromPartId,
      toId: toPartId,
      amount,
      type: 'transfer',
      description: `Transfer from ${source.name} to ${destination.name}`,
      createdAt: now,
    };

    addTransaction(transaction);

    // Close modal
    handleClose();
  };

  const handleClose = () => {
    setFromPartId('');
    setToPartId('');
    setAmount(0);
    setError(null);
    onClose();
  };

  // Filter destination parts to exclude the selected source
  const availableDestinations = parts.filter((p) => p.id !== fromPartId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Transfer Money">
      <div className="space-y-4 min-w-[320px]">
        {/* Source Part Selector */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            From (Source)
          </label>
          <select
            value={fromPartId}
            onChange={(e) => {
              setFromPartId(e.target.value);
              // Reset destination if it matches new source
              if (toPartId === e.target.value) {
                setToPartId('');
              }
              setError(null);
            }}
            className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
          >
            <option value="">Select source part...</option>
            {parts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name} (${part.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Part Selector */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            To (Destination)
          </label>
          <select
            value={toPartId}
            onChange={(e) => {
              setToPartId(e.target.value);
              setError(null);
            }}
            className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
            disabled={!fromPartId}
          >
            <option value="">Select destination part...</option>
            {availableDestinations.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name} (${part.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-pixel-text-dim)] text-[12px]">
              $
            </span>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => {
                setAmount(Math.max(0, parseFloat(e.target.value) || 0));
                setError(null);
              }}
              placeholder="0"
              min={0}
              max={sourceBalance}
              className="w-full pl-6 pr-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
            />
          </div>
          {sourcePart && (
            <p className="text-[9px] text-[var(--color-pixel-text-dim)] mt-1">
              Available: ${sourceBalance.toLocaleString()}
            </p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        {sourcePart && sourceBalance > 0 && (
          <div className="flex gap-2 flex-wrap">
            {[0.25, 0.5, 0.75, 1].map((fraction) => {
              const quickAmount = Math.floor(sourceBalance * fraction);
              if (quickAmount <= 0) return null;
              return (
                <button
                  key={fraction}
                  type="button"
                  onClick={() => setAmount(quickAmount)}
                  className="px-2 py-1 bg-[var(--color-pixel-bg)] border border-[#444] text-[var(--color-pixel-text-dim)] text-[9px] hover:border-[var(--color-pixel-accent)] hover:text-[var(--color-pixel-text)]"
                >
                  {fraction === 1 ? 'All' : `${fraction * 100}%`} (${quickAmount.toLocaleString()})
                </button>
              );
            })}
          </div>
        )}

        {/* Transfer Preview */}
        {fromPartId && toPartId && amount > 0 && (
          <div className="text-[9px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)] p-2 border border-[#444]">
            <p className="text-[var(--color-pixel-text)]">Transfer Preview:</p>
            <p className="mt-1">
              <span className="text-[var(--color-pixel-error)]">
                {sourcePart?.name}: ${sourceBalance.toLocaleString()} → ${(sourceBalance - amount).toLocaleString()}
              </span>
            </p>
            <p>
              <span className="text-[var(--color-pixel-success)]">
                {getPart(toPartId)?.name}: ${(getPart(toPartId)?.balance ?? 0).toLocaleString()} → ${((getPart(toPartId)?.balance ?? 0) + amount).toLocaleString()}
              </span>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-[var(--color-pixel-error)] text-[10px]">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleTransfer}
            disabled={!fromPartId || !toPartId || amount <= 0}
          >
            Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default TransferModal;
