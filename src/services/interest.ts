/**
 * Interest Service (Legacy)
 *
 * This service was used for the loan-based model.
 * With the commitment-based model, interest is not applicable.
 * Parts earn rewards by completing tasks, not by borrowing money.
 */

// Export empty functions for backward compatibility
export function calculateAccruedInterest(): number {
  return 0;
}

export function checkLoanDeadlines(): void {
  // No-op: Commitment deadlines are handled differently
}

export function startInterestChecker(): () => void {
  // No-op: Return empty cleanup function
  return () => {};
}
