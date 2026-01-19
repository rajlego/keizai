import { DEFAULT_SETTINGS, CENTRAL_BANK_ID } from '../models/types';
import { getCentralBank, updateCentralBank, getPart } from '../sync/yjsProvider';
import { calculateInterestRate, calculateLoanLimit } from './creditScore';

/**
 * Central Bank Service
 * Handles central bank operations including fund regeneration and lending terms
 */

/**
 * Regenerate central bank funds based on time elapsed
 * Adds credits at the configured rate (default: 100 credits/hour)
 *
 * @returns The amount of credits regenerated
 */
export function regenerateBankFunds(): number {
  const bank = getCentralBank();
  const lastRegenAt = new Date(bank.lastRegenAt);
  const now = new Date();

  // Calculate hours elapsed since last regeneration
  const hoursElapsed = (now.getTime() - lastRegenAt.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed < 0.01) {
    // Less than ~36 seconds, skip regeneration
    return 0;
  }

  // Calculate credits to add based on regen rate
  const regenRate = DEFAULT_SETTINGS.centralBankRegenRate;
  const creditsToAdd = Math.floor(hoursElapsed * regenRate);

  if (creditsToAdd <= 0) {
    return 0;
  }

  // Update bank balance and last regen time
  const newBalance = bank.balance + creditsToAdd;
  updateCentralBank({
    balance: newBalance,
    lastRegenAt: now.toISOString(),
    totalMoneySupply: bank.totalMoneySupply + creditsToAdd,
  });

  console.log(`[CentralBank] Regenerated ${creditsToAdd} credits (${hoursElapsed.toFixed(2)} hours elapsed)`);

  return creditsToAdd;
}

/**
 * Check if the central bank can lend a specific amount
 *
 * @param amount - The amount to lend
 * @returns True if the bank has sufficient balance
 */
export function canBankLend(amount: number): boolean {
  const bank = getCentralBank();
  return bank.balance >= amount;
}

/**
 * Loan terms based on a part's credit score
 */
export interface LoanTerms {
  interestRate: number;
  maxAmount: number;
  minAmount: number;
  isEligible: boolean;
  ineligibilityReason?: string;
}

/**
 * Get loan terms for a specific part based on their credit score
 *
 * @param partId - The part ID to get terms for
 * @returns The loan terms for this part
 */
export function getLoanTermsForPart(partId: string): LoanTerms {
  const part = getPart(partId);

  if (!part) {
    return {
      interestRate: 0,
      maxAmount: 0,
      minAmount: 0,
      isEligible: false,
      ineligibilityReason: 'Part not found',
    };
  }

  const bank = getCentralBank();
  const interestRate = calculateInterestRate(part.creditScore, bank.baseInterestRate);
  const maxAmount = calculateLoanLimit(part.creditScore);

  // Check if bank has any funds
  if (bank.balance <= 0) {
    return {
      interestRate,
      maxAmount,
      minAmount: 10,
      isEligible: false,
      ineligibilityReason: 'Central bank has no funds available',
    };
  }

  // Check credit score minimum
  if (part.creditScore < 350) {
    return {
      interestRate,
      maxAmount,
      minAmount: 10,
      isEligible: false,
      ineligibilityReason: 'Credit score too low (minimum 350)',
    };
  }

  // Cap max amount at bank's available balance
  const effectiveMax = Math.min(maxAmount, bank.balance);

  return {
    interestRate,
    maxAmount: effectiveMax,
    minAmount: 10,
    isEligible: true,
  };
}

/**
 * Get the current state of the central bank
 * Re-exported for convenience
 */
export { getCentralBank };

/**
 * Get the central bank ID constant
 */
export function getCentralBankId(): string {
  return CENTRAL_BANK_ID;
}

/**
 * Get total money supply in the system
 *
 * @returns Total credits in circulation
 */
export function getTotalMoneySupply(): number {
  const bank = getCentralBank();
  return bank.totalMoneySupply;
}

/**
 * Get central bank balance
 *
 * @returns Current central bank balance
 */
export function getBankBalance(): number {
  const bank = getCentralBank();
  return bank.balance;
}

/**
 * Get the base interest rate
 *
 * @returns The base interest rate as a decimal
 */
export function getBaseInterestRate(): number {
  const bank = getCentralBank();
  return bank.baseInterestRate;
}

/**
 * Update the base interest rate
 *
 * @param newRate - The new base interest rate (as decimal, e.g., 0.15 for 15%)
 */
export function setBaseInterestRate(newRate: number): void {
  if (newRate < 0 || newRate > 1) {
    console.error('[CentralBank] Invalid interest rate. Must be between 0 and 1.');
    return;
  }

  updateCentralBank({ baseInterestRate: newRate });
  console.log(`[CentralBank] Base interest rate updated to ${(newRate * 100).toFixed(1)}%`);
}

/**
 * Calculate time until next regeneration tick
 *
 * @returns Minutes until next credit regeneration
 */
export function getTimeUntilNextRegen(): number {
  const bank = getCentralBank();
  const lastRegenAt = new Date(bank.lastRegenAt);
  const now = new Date();

  const minutesElapsed = (now.getTime() - lastRegenAt.getTime()) / (1000 * 60);
  const minutesUntilNext = 60 - (minutesElapsed % 60);

  return Math.max(0, minutesUntilNext);
}

/**
 * Format a credit amount for display
 *
 * @param amount - The credit amount
 * @returns Formatted string with currency symbol
 */
export function formatCredits(amount: number): string {
  return `${amount.toLocaleString()} credits`;
}
