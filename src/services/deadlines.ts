import type { Commitment, Transaction } from '../models/types';
import { getAllCommitments, updateCommitment, addTransaction } from '../sync/yjsProvider';
import { applyCreditScoreChange, calculateScoreChange } from './creditScore';

/**
 * Deadline Enforcement Service
 * Monitors active commitments and enforces deadline failures
 */

// Interval ID for cleanup
let deadlineCheckerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Check if a commitment's deadline has expired
 *
 * @param commitment - The commitment to check
 * @returns true if the deadline has passed and commitment is still active
 */
export function isDeadlineExpired(commitment: Commitment): boolean {
  if (commitment.status !== 'active') {
    return false;
  }

  const deadline = new Date(commitment.deadline);
  const now = new Date();

  return now > deadline;
}

/**
 * Check all active commitments for expired deadlines
 * Marks expired commitments as 'failed', applies credit score penalties,
 * and creates transaction records for any penalties
 *
 * @returns Array of commitment IDs that were marked as failed
 */
export function checkDeadlines(): string[] {
  const commitments = getAllCommitments();
  const failedCommitmentIds: string[] = [];

  for (const commitment of commitments) {
    if (isDeadlineExpired(commitment)) {
      const failedAt = new Date().toISOString();

      // Update commitment status to failed
      updateCommitment(commitment.id, {
        status: 'failed',
        failedAt,
      });

      // Apply credit score penalty for default (-30)
      const penaltyAmount = calculateScoreChange('default');
      applyCreditScoreChange(
        commitment.partId,
        penaltyAmount,
        `Commitment deadline expired: ${commitment.description}`,
        commitment.id
      );

      // Create a transaction record for the failure (penalty record)
      const penaltyTransaction: Transaction = {
        id: crypto.randomUUID(),
        fromId: commitment.partId,
        toId: 'system',
        amount: 0, // No monetary penalty, just credit score impact
        type: 'penalty',
        commitmentId: commitment.id,
        description: `Commitment failed due to expired deadline: ${commitment.description}`,
        createdAt: failedAt,
      };

      addTransaction(penaltyTransaction);

      console.log(
        `[Deadlines] Commitment failed: ${commitment.id} - "${commitment.description}" ` +
        `(Part: ${commitment.partId}, Deadline: ${commitment.deadline})`
      );

      failedCommitmentIds.push(commitment.id);
    }
  }

  if (failedCommitmentIds.length > 0) {
    console.log(`[Deadlines] Marked ${failedCommitmentIds.length} commitment(s) as failed`);
  }

  return failedCommitmentIds;
}

/**
 * Start the periodic deadline checker
 * Runs every minute (60000ms) to check for expired deadlines
 *
 * @param intervalMs - Interval in milliseconds (default: 60000 = 1 minute)
 * @returns Cleanup function to stop the checker
 */
export function startDeadlineChecker(intervalMs: number = 60000): () => void {
  // Clear any existing interval
  if (deadlineCheckerInterval) {
    clearInterval(deadlineCheckerInterval);
  }

  // Run an initial check immediately
  console.log('[Deadlines] Starting deadline checker...');
  checkDeadlines();

  // Set up periodic checks
  deadlineCheckerInterval = setInterval(() => {
    checkDeadlines();
  }, intervalMs);

  // Return cleanup function
  return () => {
    if (deadlineCheckerInterval) {
      clearInterval(deadlineCheckerInterval);
      deadlineCheckerInterval = null;
      console.log('[Deadlines] Deadline checker stopped');
    }
  };
}

/**
 * Stop the deadline checker if it's running
 */
export function stopDeadlineChecker(): void {
  if (deadlineCheckerInterval) {
    clearInterval(deadlineCheckerInterval);
    deadlineCheckerInterval = null;
    console.log('[Deadlines] Deadline checker stopped');
  }
}
