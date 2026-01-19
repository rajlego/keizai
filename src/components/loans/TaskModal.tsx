import { useState, useEffect, useMemo } from 'react';
import type { Commitment, Part } from '../../models/types';
import { CENTRAL_BANK_ID } from '../../models/types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Countdown } from '../common/Countdown';
import { useUIStore } from '../../store/uiStore';
import {
  getCommitment,
  getPart,
  updateCommitment,
  updatePart,
  getCentralBank,
  updateCentralBank,
  addTransaction,
  onCommitmentsChange,
} from '../../sync/yjsProvider';

// Simple ID generator
function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Get progress status for anxious parts
function getProgressStatus(commitment: Commitment): { status: 'ahead' | 'on-track' | 'at-risk' | 'behind'; message: string; color: string } {
  const now = new Date();
  const deadline = new Date(commitment.deadline);
  const created = new Date(commitment.createdAt);

  const totalTime = deadline.getTime() - created.getTime();
  const elapsedTime = now.getTime() - created.getTime();
  const timeProgress = Math.min(1, elapsedTime / totalTime);

  const completedTasks = commitment.tasks.filter(t => t.isCompleted).length;
  const taskProgress = commitment.tasks.length > 0 ? completedTasks / commitment.tasks.length : 0;

  // Compare task progress to time progress
  const difference = taskProgress - timeProgress;

  if (taskProgress === 1) {
    return { status: 'ahead', message: 'All done! Great work!', color: 'var(--color-pixel-success)' };
  } else if (difference > 0.2) {
    return { status: 'ahead', message: 'Ahead of schedule!', color: 'var(--color-pixel-success)' };
  } else if (difference > -0.1) {
    return { status: 'on-track', message: 'On track', color: 'var(--color-pixel-accent)' };
  } else if (difference > -0.3) {
    return { status: 'at-risk', message: 'Getting tight...', color: 'var(--color-pixel-warning)' };
  } else {
    return { status: 'behind', message: 'Need to catch up', color: 'var(--color-pixel-error)' };
  }
}

export function TaskModal() {
  const isOpen = useUIStore((state) => state.isTaskModalOpen);
  const commitmentId = useUIStore((state) => state.taskModalLoanId);
  const closeModal = useUIStore((state) => state.closeTaskModal);

  const [commitment, setCommitment] = useState<Commitment | undefined>();
  const [part, setPart] = useState<Part | undefined>();
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [justCompletedTask, setJustCompletedTask] = useState<string | null>(null);

  // Load commitment and part
  useEffect(() => {
    if (commitmentId) {
      const c = getCommitment(commitmentId);
      setCommitment(c);
      if (c) {
        setPart(getPart(c.partId));
      }
    }
  }, [commitmentId]);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = onCommitmentsChange(() => {
      if (commitmentId) {
        const c = getCommitment(commitmentId);
        setCommitment(c);
        if (c) {
          setPart(getPart(c.partId));
        }
      }
    });
    return () => unsubscribe();
  }, [commitmentId]);

  // Clear celebration after 2 seconds
  useEffect(() => {
    if (justCompletedTask) {
      const timer = setTimeout(() => setJustCompletedTask(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [justCompletedTask]);

  // Progress status for anxious parts
  const progressStatus = useMemo(() => {
    if (!commitment || commitment.status !== 'active') return null;
    return getProgressStatus(commitment);
  }, [commitment]);

  if (!commitment || !part) {
    return null;
  }

  const completedTasks = commitment.tasks.filter((t) => t.isCompleted).length;
  const totalTasks = commitment.tasks.length;
  const totalReward = commitment.tasks.reduce((sum, t) => sum + t.reward, 0);
  const earnedReward = commitment.tasks
    .filter((t) => t.isCompleted)
    .reduce((sum, t) => sum + t.reward, 0);

  // Handle completing a task
  const handleCompleteTask = (taskId: string) => {
    const task = commitment.tasks.find((t) => t.id === taskId);
    if (!task || task.isCompleted) return;

    const now = new Date().toISOString();

    // Update the task as completed
    const updatedTasks = commitment.tasks.map((t) =>
      t.id === taskId ? { ...t, isCompleted: true, completedAt: now } : t
    );

    // Check if all tasks are now completed
    const allCompleted = updatedTasks.every((t) => t.isCompleted);

    // Pay the reward to the part
    const reward = task.reward;

    // Get funds from funder (Central Bank)
    if (commitment.funderId === CENTRAL_BANK_ID) {
      const bank = getCentralBank();
      updateCentralBank({ balance: bank.balance - reward });
    } else {
      const funder = getPart(commitment.funderId);
      if (funder) {
        updatePart(commitment.funderId, { balance: funder.balance - reward });
      }
    }

    // Pay the part
    updatePart(part.id, { balance: part.balance + reward });

    // Record the transaction
    addTransaction({
      id: generateId('txn'),
      fromId: commitment.funderId,
      toId: part.id,
      amount: reward,
      type: 'task_reward',
      commitmentId: commitment.id,
      taskId: taskId,
      description: `Task completed: ${task.description}`,
      createdAt: now,
    });

    // Update the commitment
    updateCommitment(commitment.id, {
      tasks: updatedTasks,
      status: allCompleted ? 'completed' : 'active',
      completedAt: allCompleted ? now : undefined,
    });

    // Trigger celebration
    setJustCompletedTask(taskId);

    // Update credit score if all completed
    if (allCompleted) {
      const deadline = new Date(commitment.deadline);
      const isEarly = new Date() < deadline;
      const scoreBonus = isEarly ? 25 : 15; // +25 for early, +15 for on-time
      const newScore = Math.min(850, part.creditScore + scoreBonus);
      updatePart(part.id, { creditScore: newScore });
    }
  };

  // Handle extending deadline (for Procrastinator)
  const handleExtendDeadline = (hours: number) => {
    const currentDeadline = new Date(commitment.deadline);
    const newDeadline = new Date(currentDeadline.getTime() + hours * 60 * 60 * 1000);

    // Small credit score penalty for extending (-5)
    const newScore = Math.max(300, part.creditScore - 5);
    updatePart(part.id, { creditScore: newScore });

    updateCommitment(commitment.id, {
      deadline: newDeadline.toISOString(),
    });

    // Record the extension
    addTransaction({
      id: generateId('txn'),
      fromId: part.id,
      toId: 'system',
      amount: 0,
      type: 'penalty',
      commitmentId: commitment.id,
      description: `Extended deadline by ${hours}h (-5 credit score)`,
      createdAt: new Date().toISOString(),
    });

    setShowExtendDialog(false);
  };

  // Handle cancelling commitment (for Rebel)
  const handleCancelCommitment = () => {
    const now = new Date().toISOString();

    // Credit score penalty for cancelling (-15)
    const newScore = Math.max(300, part.creditScore - 15);
    updatePart(part.id, { creditScore: newScore });

    updateCommitment(commitment.id, {
      status: 'failed',
      failedAt: now,
    });

    // Record the cancellation
    addTransaction({
      id: generateId('txn'),
      fromId: part.id,
      toId: 'system',
      amount: 0,
      type: 'penalty',
      commitmentId: commitment.id,
      description: `Cancelled commitment (-15 credit score)`,
      createdAt: now,
    });

    setShowCancelDialog(false);
    closeModal();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={commitment.description || 'Commitment'}>
      <div className="space-y-4 min-w-[320px] max-w-[400px]">
        {/* Part Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-2 border-[#888] bg-[var(--color-pixel-bg)] overflow-hidden">
            {part.avatarUrl ? (
              <img src={part.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[16px] text-[var(--color-pixel-text-dim)]">
                {part.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-[12px] text-[var(--color-pixel-accent)]">{part.name}</p>
            <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
              Balance: <span className="text-[var(--color-pixel-success)]">${part.balance.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="flex justify-between items-center p-2 bg-[var(--color-pixel-bg)] border border-[#444]">
          <div className="text-center">
            <p className="text-[8px] text-[var(--color-pixel-text-dim)]">Progress</p>
            <p className="text-[12px] text-[var(--color-pixel-accent)]">
              {completedTasks}/{totalTasks}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-[var(--color-pixel-text-dim)]">Earned</p>
            <p className="text-[12px] text-[var(--color-pixel-success)]">${earnedReward}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-[var(--color-pixel-text-dim)]">Remaining</p>
            <p className="text-[12px] text-[var(--color-pixel-warning)]">${totalReward - earnedReward}</p>
          </div>
        </div>

        {/* Progress Status (for Anxious parts) */}
        {progressStatus && commitment.status === 'active' && (
          <div
            className="p-2 border text-center text-[10px]"
            style={{
              borderColor: progressStatus.color,
              backgroundColor: `${progressStatus.color}15`,
            }}
          >
            <span style={{ color: progressStatus.color }}>{progressStatus.message}</span>
          </div>
        )}

        {/* Deadline */}
        {commitment.status === 'active' && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--color-pixel-text-dim)]">Deadline:</span>
            <div className="flex items-center gap-2">
              <Countdown deadline={commitment.deadline} />
              <button
                onClick={() => setShowExtendDialog(true)}
                className="text-[8px] text-[var(--color-pixel-warning)] hover:text-[var(--color-pixel-accent)] underline"
              >
                extend
              </button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-2">
          <p className="text-[9px] text-[var(--color-pixel-text-dim)] uppercase tracking-wider">Tasks</p>
          {commitment.tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-2 border transition-all duration-300 ${
                justCompletedTask === task.id
                  ? 'bg-[var(--color-pixel-success)]/30 border-[var(--color-pixel-success)] scale-[1.02]'
                  : task.isCompleted
                    ? 'bg-[var(--color-pixel-success)]/10 border-[var(--color-pixel-success)]/30'
                    : 'bg-[var(--color-pixel-bg)] border-[#444]'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleCompleteTask(task.id)}
                disabled={task.isCompleted || commitment.status !== 'active'}
                className={`w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                  task.isCompleted
                    ? 'bg-[var(--color-pixel-success)] border-[var(--color-pixel-success)] text-white'
                    : 'border-[#888] hover:border-[var(--color-pixel-accent)] hover:scale-110'
                } ${commitment.status !== 'active' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {task.isCompleted && (
                  <span className="text-[10px]">✓</span>
                )}
              </button>

              {/* Description */}
              <span
                className={`flex-1 text-[10px] ${
                  task.isCompleted
                    ? 'text-[var(--color-pixel-text-dim)] line-through'
                    : 'text-[var(--color-pixel-text)]'
                }`}
              >
                {task.description}
              </span>

              {/* Reward with celebration */}
              <span
                className={`text-[9px] font-bold transition-all ${
                  justCompletedTask === task.id
                    ? 'text-[var(--color-pixel-success)] scale-125'
                    : task.isCompleted
                      ? 'text-[var(--color-pixel-success)]'
                      : 'text-[var(--color-pixel-warning)]'
                }`}
              >
                {justCompletedTask === task.id ? '+$' + task.reward + '!' : task.isCompleted ? '✓ $' + task.reward : '+$' + task.reward}
              </span>
            </div>
          ))}
        </div>

        {/* Status Messages */}
        {commitment.status === 'completed' && (
          <div className="p-2 bg-[var(--color-pixel-success)]/20 border border-[var(--color-pixel-success)]/50 text-center">
            <p className="text-[10px] text-[var(--color-pixel-success)]">
              All tasks completed! Credit score increased.
            </p>
          </div>
        )}

        {commitment.status === 'failed' && (
          <div className="p-2 bg-[var(--color-pixel-error)]/20 border border-[var(--color-pixel-error)]/50 text-center">
            <p className="text-[10px] text-[var(--color-pixel-error)]">
              Commitment failed. Credit score decreased.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-2">
          {commitment.status === 'active' && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="text-[9px] text-[var(--color-pixel-error)] hover:underline"
            >
              Cancel commitment
            </button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>

        {/* Extend Deadline Dialog */}
        {showExtendDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-pixel-surface)] border-2 border-[var(--color-pixel-secondary)] p-4 space-y-4 min-w-[280px]">
              <h3 className="text-[12px] text-[var(--color-pixel-accent)]">Extend Deadline</h3>
              <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
                Choose how much time to add. This will cost 5 credit score points.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[2, 4, 8].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => handleExtendDeadline(hours)}
                    className="p-2 border border-[#888] hover:border-[var(--color-pixel-accent)] text-[10px] text-[var(--color-pixel-text)]"
                  >
                    +{hours}h
                  </button>
                ))}
                {[24, 48, 72].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => handleExtendDeadline(hours)}
                    className="p-2 border border-[#888] hover:border-[var(--color-pixel-accent)] text-[10px] text-[var(--color-pixel-text)]"
                  >
                    +{hours / 24}d
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowExtendDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Commitment Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-pixel-surface)] border-2 border-[var(--color-pixel-error)] p-4 space-y-4 min-w-[280px]">
              <h3 className="text-[12px] text-[var(--color-pixel-error)]">Cancel Commitment?</h3>
              <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
                This will mark the commitment as failed and cost 15 credit score points.
                You won't earn any rewards for incomplete tasks.
              </p>
              <p className="text-[10px] text-[var(--color-pixel-text)]">
                Sometimes it's better to let go and try again. That's okay.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowCancelDialog(false)}>
                  Keep trying
                </Button>
                <Button variant="danger" size="sm" onClick={handleCancelCommitment}>
                  Cancel it
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default TaskModal;
