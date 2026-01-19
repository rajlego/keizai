import type { CreditScoreEvent } from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';
import { getPart, updatePart, addCreditEvent } from '../sync/yjsProvider';

/**
 * Credit Score Service
 * Handles all credit score calculations and updates for parts
 */

/**
 * Calculate interest rate based on credit score
 * Higher credit score = lower interest rate
 * Formula: rate = baseRate * (2.0 - 1.5 * ((score - 300) / 550))
 *
 * @param creditScore - The borrower's credit score (300-850)
 * @param baseRate - The base interest rate (default from settings)
 * @returns The calculated interest rate
 */
export function calculateInterestRate(creditScore: number, baseRate: number): number {
  // Clamp credit score to valid range
  const clampedScore = Math.max(
    DEFAULT_SETTINGS.minCreditScore,
    Math.min(DEFAULT_SETTINGS.maxCreditScore, creditScore)
  );

  // Score 300 → multiplier 2.0 (highest rate)
  // Score 850 → multiplier 0.5 (lowest rate)
  const scoreRatio = (clampedScore - 300) / 550;
  const multiplier = 2.0 - 1.5 * scoreRatio;

  return baseRate * multiplier;
}

/**
 * Calculate maximum loan amount based on credit score
 * Score 300 → 500 credits
 * Score 850 → 5000 credits
 * Linear interpolation between these values
 *
 * @param creditScore - The borrower's credit score (300-850)
 * @returns Maximum loan amount allowed
 */
export function calculateLoanLimit(creditScore: number): number {
  const clampedScore = Math.max(
    DEFAULT_SETTINGS.minCreditScore,
    Math.min(DEFAULT_SETTINGS.maxCreditScore, creditScore)
  );

  const minLimit = 500;
  const maxLimit = 5000;
  const scoreRatio = (clampedScore - 300) / 550;

  return Math.round(minLimit + (maxLimit - minLimit) * scoreRatio);
}

/**
 * Outcome types that affect credit score
 */
export type CreditOutcome = 'early' | 'on-time' | 'late' | 'default';

/**
 * Calculate credit score change based on repayment outcome
 *
 * @param outcome - The repayment outcome
 * @returns The credit score change (positive or negative)
 */
export function calculateScoreChange(outcome: CreditOutcome): number {
  switch (outcome) {
    case 'early':
      return 25;  // Reward for early repayment
    case 'on-time':
      return 15;  // Reward for on-time repayment
    case 'late':
      return -10; // Penalty for late repayment
    case 'default':
      return -30; // Major penalty for defaulting
    default:
      return 0;
  }
}

/**
 * Apply a credit score change to a part and record the event
 *
 * @param partId - The ID of the part to update
 * @param change - The credit score change (positive or negative)
 * @param reason - Description of why the score changed
 * @param commitmentId - Optional commitment ID associated with this change
 * @returns The new credit score, or null if part not found
 */
export function applyCreditScoreChange(
  partId: string,
  change: number,
  reason: string,
  commitmentId?: string
): number | null {
  const part = getPart(partId);
  if (!part) {
    console.error(`[CreditScore] Part not found: ${partId}`);
    return null;
  }

  const previousScore = part.creditScore;

  // Calculate new score, clamped to valid range
  const newScore = Math.max(
    DEFAULT_SETTINGS.minCreditScore,
    Math.min(DEFAULT_SETTINGS.maxCreditScore, previousScore + change)
  );

  // Update the part's credit score
  updatePart(partId, { creditScore: newScore });

  // Record the credit event
  const event: CreditScoreEvent = {
    id: crypto.randomUUID(),
    partId,
    previousScore,
    newScore,
    change: newScore - previousScore, // Actual change after clamping
    reason,
    commitmentId,
    createdAt: new Date().toISOString(),
  };

  addCreditEvent(event);

  console.log(`[CreditScore] ${part.name}: ${previousScore} -> ${newScore} (${change > 0 ? '+' : ''}${change}) - ${reason}`);

  return newScore;
}

/**
 * Get a descriptive rating for a credit score
 *
 * @param creditScore - The credit score to evaluate
 * @returns A human-readable credit rating
 */
export function getCreditRating(creditScore: number): string {
  if (creditScore >= 800) return 'Excellent';
  if (creditScore >= 740) return 'Very Good';
  if (creditScore >= 670) return 'Good';
  if (creditScore >= 580) return 'Fair';
  return 'Poor';
}

/**
 * Get the color class for displaying a credit score
 *
 * @param creditScore - The credit score to evaluate
 * @returns A Tailwind color class for the score
 */
export function getCreditScoreColor(creditScore: number): string {
  if (creditScore >= 800) return 'text-success';
  if (creditScore >= 740) return 'text-info';
  if (creditScore >= 670) return 'text-primary';
  if (creditScore >= 580) return 'text-warning';
  return 'text-error';
}
