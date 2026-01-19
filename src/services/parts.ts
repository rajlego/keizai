import type { Part } from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';
import { addPart, getPart, updatePart, deletePart, getAllParts } from '../sync/yjsProvider';

/**
 * Parts Service
 * Handles creation and management of IFS parts with financial attributes
 */

/**
 * Create a new part with default financial attributes
 *
 * @param name - The name of the part
 * @param avatarUrl - Optional URL to an avatar image
 * @param avatarPrompt - Optional prompt used to generate the avatar
 * @returns The newly created part
 */
export function createPart(
  name: string,
  avatarUrl?: string,
  avatarPrompt?: string
): Part {
  const now = new Date().toISOString();

  const part: Part = {
    id: crypto.randomUUID(),
    name: name.trim(),
    avatarUrl,
    avatarPrompt,
    balance: DEFAULT_SETTINGS.startingBalance,
    creditScore: DEFAULT_SETTINGS.startingCreditScore,
    createdAt: now,
    updatedAt: now,
  };

  addPart(part);

  console.log(`[Parts] Created new part: ${part.name} (${part.id})`);

  return part;
}

/**
 * Get a part by ID
 * Re-exported from yjsProvider for convenience
 */
export { getPart };

/**
 * Update a part's properties
 * Re-exported from yjsProvider for convenience
 */
export { updatePart };

/**
 * Delete a part by ID
 * Re-exported from yjsProvider for convenience
 */
export { deletePart };

/**
 * Get all parts
 * Re-exported from yjsProvider for convenience
 */
export { getAllParts };

/**
 * Check if a part has sufficient balance for a transaction
 *
 * @param partId - The part ID to check
 * @param amount - The amount needed
 * @returns True if the part has sufficient balance
 */
export function hasSufficientBalance(partId: string, amount: number): boolean {
  const part = getPart(partId);
  if (!part) {
    return false;
  }
  return part.balance >= amount;
}

/**
 * Transfer credits between two parts
 *
 * @param fromPartId - The part sending credits
 * @param toPartId - The part receiving credits
 * @param amount - The amount to transfer
 * @returns True if transfer was successful
 */
export function transferCredits(fromPartId: string, toPartId: string, amount: number): boolean {
  const fromPart = getPart(fromPartId);
  const toPart = getPart(toPartId);

  if (!fromPart || !toPart) {
    console.error('[Parts] Transfer failed: One or both parts not found');
    return false;
  }

  if (fromPart.balance < amount) {
    console.error('[Parts] Transfer failed: Insufficient balance');
    return false;
  }

  // Update both balances
  updatePart(fromPartId, { balance: fromPart.balance - amount });
  updatePart(toPartId, { balance: toPart.balance + amount });

  console.log(`[Parts] Transferred ${amount} credits from ${fromPart.name} to ${toPart.name}`);

  return true;
}

/**
 * Add credits to a part's balance
 *
 * @param partId - The part to add credits to
 * @param amount - The amount to add
 * @returns The new balance, or null if part not found
 */
export function addCredits(partId: string, amount: number): number | null {
  const part = getPart(partId);
  if (!part) {
    console.error(`[Parts] Cannot add credits: Part not found (${partId})`);
    return null;
  }

  const newBalance = part.balance + amount;
  updatePart(partId, { balance: newBalance });

  return newBalance;
}

/**
 * Deduct credits from a part's balance
 *
 * @param partId - The part to deduct credits from
 * @param amount - The amount to deduct
 * @returns The new balance, or null if part not found or insufficient funds
 */
export function deductCredits(partId: string, amount: number): number | null {
  const part = getPart(partId);
  if (!part) {
    console.error(`[Parts] Cannot deduct credits: Part not found (${partId})`);
    return null;
  }

  if (part.balance < amount) {
    console.error(`[Parts] Cannot deduct credits: Insufficient balance`);
    return null;
  }

  const newBalance = part.balance - amount;
  updatePart(partId, { balance: newBalance });

  return newBalance;
}

/**
 * Update a part's avatar
 *
 * @param partId - The part ID to update
 * @param avatarUrl - The new avatar URL
 * @param avatarPrompt - The prompt used to generate the avatar
 */
export function updateAvatar(partId: string, avatarUrl: string, avatarPrompt?: string): void {
  updatePart(partId, { avatarUrl, avatarPrompt });
  console.log(`[Parts] Updated avatar for part ${partId}`);
}

/**
 * Rename a part
 *
 * @param partId - The part ID to rename
 * @param newName - The new name
 */
export function renamePart(partId: string, newName: string): void {
  updatePart(partId, { name: newName.trim() });
  console.log(`[Parts] Renamed part ${partId} to "${newName}"`);
}

/**
 * Check if a part name already exists
 *
 * @param name - The name to check
 * @param excludeId - Optional ID to exclude from check (for renaming)
 * @returns True if the name is already in use
 */
export function isNameTaken(name: string, excludeId?: string): boolean {
  const normalizedName = name.trim().toLowerCase();
  const parts = getAllParts();

  return parts.some(
    (part) => part.name.toLowerCase() === normalizedName && part.id !== excludeId
  );
}
