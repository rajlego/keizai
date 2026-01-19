/**
 * Loans Service (Legacy)
 *
 * This service was used for the loan-based model.
 * With the commitment-based model, these functions are no longer needed.
 * Commitments are created directly through the UI.
 */

import type { Commitment, CommitmentTask } from '../models/types';
import { CENTRAL_BANK_ID } from '../models/types';
import { addCommitment } from '../sync/yjsProvider';

// Simple ID generator
function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Create a new commitment
 */
export function createCommitment(
  partId: string,
  description: string,
  tasks: Array<{ description: string; reward: number }>,
  deadlineHours: number = 8
): Commitment {
  const now = new Date();
  const deadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);

  const commitmentTasks: CommitmentTask[] = tasks.map((t) => ({
    id: generateId('task'),
    description: t.description,
    reward: t.reward,
    isCompleted: false,
  }));

  const commitment: Commitment = {
    id: generateId('commit'),
    partId,
    funderId: CENTRAL_BANK_ID,
    tasks: commitmentTasks,
    description,
    createdAt: now.toISOString(),
    deadline: deadline.toISOString(),
    status: 'active',
    notificationCount: 0,
  };

  addCommitment(commitment);

  return commitment;
}

// Legacy exports for backward compatibility
export const requestLoan = createCommitment;
export const approveLoan = () => {};
export const rejectLoan = () => {};
