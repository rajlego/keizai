import { useState, useEffect } from 'react';
import type { Part, Commitment, CommitmentTask } from '../../models/types';
import { CENTRAL_BANK_ID } from '../../models/types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useUIStore } from '../../store/uiStore';
import {
  getAllParts,
  onPartsChange,
  addCommitment,
} from '../../sync/yjsProvider';

// Simple ID generator
function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface TaskInput {
  id: string;
  description: string;
  reward: number;
}

export function NewLoanModal() {
  const isOpen = useUIStore((state) => state.isNewLoanModalOpen);
  const preselectedBorrowerId = useUIStore((state) => state.loanModalBorrowerId);
  const closeModal = useUIStore((state) => state.closeNewLoanModal);

  const [parts, setParts] = useState<Part[]>([]);
  const [partId, setPartId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [deadlineHours, setDeadlineHours] = useState<number>(8);
  const [tasks, setTasks] = useState<TaskInput[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskReward, setNewTaskReward] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  // Load parts
  useEffect(() => {
    setParts(getAllParts());
    const unsubscribe = onPartsChange((updatedParts) => {
      setParts(updatedParts);
    });
    return () => unsubscribe();
  }, []);

  // Set preselected part when modal opens
  useEffect(() => {
    if (isOpen && preselectedBorrowerId) {
      setPartId(preselectedBorrowerId);
    }
  }, [isOpen, preselectedBorrowerId]);

  // Calculate total reward
  const totalReward = tasks.reduce((sum, t) => sum + t.reward, 0);

  // Add a new task
  const handleAddTask = () => {
    if (!newTaskDescription.trim()) {
      setError('Please enter a task description');
      return;
    }
    if (newTaskReward <= 0) {
      setError('Reward must be greater than 0');
      return;
    }

    setError(null);
    setTasks([
      ...tasks,
      {
        id: generateId('task'),
        description: newTaskDescription.trim(),
        reward: newTaskReward,
      },
    ]);
    setNewTaskDescription('');
    setNewTaskReward(50);
  };

  // Remove a task
  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  // Create the commitment
  const handleCreateCommitment = () => {
    if (!partId) {
      setError('Please select a part');
      return;
    }
    if (tasks.length === 0) {
      setError('Please add at least one task');
      return;
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);

    // Create commitment tasks
    const commitmentTasks: CommitmentTask[] = tasks.map((t) => ({
      id: t.id,
      description: t.description,
      reward: t.reward,
      isCompleted: false,
    }));

    // Create the commitment
    const newCommitment: Commitment = {
      id: generateId('commit'),
      partId,
      funderId: CENTRAL_BANK_ID, // Central bank pays for completed tasks
      tasks: commitmentTasks,
      description: description.trim() || 'Commitment',
      createdAt: now.toISOString(),
      deadline: deadline.toISOString(),
      status: 'active',
      notificationCount: 0,
    };

    // Add the commitment (no money changes hands yet)
    addCommitment(newCommitment);
    handleClose();
  };

  const handleClose = () => {
    setPartId('');
    setDescription('');
    setDeadlineHours(8);
    setTasks([]);
    setNewTaskDescription('');
    setNewTaskReward(50);
    setError(null);
    closeModal();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Commitment">
      <div className="space-y-4 min-w-[360px] max-w-[480px]">
        {/* Part Selector */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Part making the commitment
          </label>
          <select
            value={partId}
            onChange={(e) => setPartId(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
          >
            <option value="">Select a part...</option>
            {parts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            What are you committing to? (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Morning routine, Project work..."
            className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
          />
        </div>

        {/* Deadline Hours */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Deadline (hours from now)
          </label>
          <input
            type="number"
            value={deadlineHours}
            onChange={(e) => setDeadlineHours(Math.max(1, parseInt(e.target.value) || 8))}
            min={1}
            max={168}
            className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
          />
        </div>

        {/* Tasks Section */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Tasks (things you'll do to earn rewards)
          </label>

          {/* Existing Tasks */}
          {tasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 bg-[var(--color-pixel-bg)] border border-[#444]"
                >
                  <span className="flex-1 text-[10px] text-[var(--color-pixel-text)] truncate">
                    {task.description}
                  </span>
                  <span className="text-[9px] text-[var(--color-pixel-success)] font-bold">
                    +${task.reward}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="text-[var(--color-pixel-error)] hover:text-white text-[10px] px-1"
                  >
                    X
                  </button>
                </div>
              ))}
              <div className="text-[9px] text-[var(--color-pixel-accent)] text-right">
                Total potential reward: ${totalReward}
              </div>
            </div>
          )}

          {/* Add Task Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="What will you do?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                className="flex-1 px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-[9px] text-[var(--color-pixel-text-dim)]">Reward: $</label>
              <input
                type="number"
                value={newTaskReward}
                onChange={(e) => setNewTaskReward(Math.max(1, parseInt(e.target.value) || 50))}
                min={1}
                className="w-20 px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddTask}
              >
                Add Task
              </Button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="text-[9px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)] p-2 border border-[#444]">
          <p>Complete tasks before the deadline to earn rewards.</p>
          <p className="mt-1">Missing the deadline will hurt your credit score.</p>
        </div>

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
            onClick={handleCreateCommitment}
            disabled={!partId || tasks.length === 0}
          >
            Create Commitment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default NewLoanModal;
