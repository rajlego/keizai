/**
 * Export/Import functionality for Keizai data backup and restore
 */

import type { Part, Commitment, Transaction, CreditScoreEvent, CentralBank } from '../models/types';
import {
  getAllParts,
  getAllCommitments,
  getAllTransactions,
  getAllCreditEvents,
  getCentralBank,
  clearAllData,
  addPart,
  addCommitment,
  addTransaction,
  addCreditEvent,
  updateCentralBank,
  getPart,
  getCommitment,
  updatePart,
  updateCommitment,
  ydoc,
} from '../sync/yjsProvider';

// Current export format version
const EXPORT_VERSION = 1;

/**
 * Structure of exported data
 */
export interface ExportData {
  version: number;
  exportedAt: string;
  parts: Part[];
  commitments: Commitment[];
  transactions: Transaction[];
  creditEvents: CreditScoreEvent[];
  centralBank: CentralBank;
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  partsImported: number;
  commitmentsImported: number;
  transactionsImported: number;
  creditEventsImported: number;
  errors: string[];
}

/**
 * Validates that data matches the ExportData interface
 */
export function validateExportData(data: unknown): data is ExportData {
  if (data === null || typeof data !== 'object') {
    return false;
  }

  const d = data as Record<string, unknown>;

  // Check version
  if (typeof d.version !== 'number' || d.version < 1) {
    return false;
  }

  // Check exportedAt
  if (typeof d.exportedAt !== 'string') {
    return false;
  }

  // Check parts array
  if (!Array.isArray(d.parts)) {
    return false;
  }
  for (const part of d.parts) {
    if (!validatePart(part)) {
      return false;
    }
  }

  // Check commitments array
  if (!Array.isArray(d.commitments)) {
    return false;
  }
  for (const commitment of d.commitments) {
    if (!validateCommitment(commitment)) {
      return false;
    }
  }

  // Check transactions array
  if (!Array.isArray(d.transactions)) {
    return false;
  }
  for (const transaction of d.transactions) {
    if (!validateTransaction(transaction)) {
      return false;
    }
  }

  // Check creditEvents array
  if (!Array.isArray(d.creditEvents)) {
    return false;
  }
  for (const event of d.creditEvents) {
    if (!validateCreditEvent(event)) {
      return false;
    }
  }

  // Check centralBank
  if (!validateCentralBank(d.centralBank)) {
    return false;
  }

  return true;
}

function validatePart(data: unknown): data is Part {
  if (data === null || typeof data !== 'object') return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.balance === 'number' &&
    typeof p.creditScore === 'number' &&
    typeof p.createdAt === 'string' &&
    typeof p.updatedAt === 'string'
  );
}

function validateCommitment(data: unknown): data is Commitment {
  if (data === null || typeof data !== 'object') return false;
  const c = data as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.partId === 'string' &&
    typeof c.funderId === 'string' &&
    Array.isArray(c.tasks) &&
    typeof c.description === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.deadline === 'string' &&
    typeof c.status === 'string' &&
    ['active', 'completed', 'failed'].includes(c.status as string) &&
    typeof c.notificationCount === 'number'
  );
}

function validateTransaction(data: unknown): data is Transaction {
  if (data === null || typeof data !== 'object') return false;
  const t = data as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.fromId === 'string' &&
    typeof t.toId === 'string' &&
    typeof t.amount === 'number' &&
    typeof t.type === 'string' &&
    ['task_reward', 'transfer', 'bonus', 'penalty'].includes(t.type as string) &&
    typeof t.description === 'string' &&
    typeof t.createdAt === 'string'
  );
}

function validateCreditEvent(data: unknown): data is CreditScoreEvent {
  if (data === null || typeof data !== 'object') return false;
  const e = data as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.partId === 'string' &&
    typeof e.previousScore === 'number' &&
    typeof e.newScore === 'number' &&
    typeof e.change === 'number' &&
    typeof e.reason === 'string' &&
    typeof e.createdAt === 'string'
  );
}

function validateCentralBank(data: unknown): data is CentralBank {
  if (data === null || typeof data !== 'object') return false;
  const b = data as Record<string, unknown>;
  return (
    typeof b.balance === 'number' &&
    typeof b.baseInterestRate === 'number' &&
    typeof b.lastRegenAt === 'string' &&
    typeof b.totalMoneySupply === 'number'
  );
}

/**
 * Export all Keizai data to a JSON file
 * Triggers a browser download with filename keizai-backup-{date}.json
 */
export function exportToJSON(): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    parts: getAllParts(),
    commitments: getAllCommitments(),
    transactions: getAllTransactions(),
    creditEvents: getAllCreditEvents(),
    centralBank: getCentralBank(),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `keizai-backup-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON backup file
 * @param file - The JSON file to import
 * @param mode - 'replace' clears all existing data first, 'merge' adds new items and updates existing ones
 * @returns ImportResult with counts of imported items and any errors
 */
export async function importFromJSON(file: File, mode: 'merge' | 'replace'): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    partsImported: 0,
    commitmentsImported: 0,
    transactionsImported: 0,
    creditEventsImported: 0,
    errors: [],
  };

  try {
    const text = await file.text();
    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      result.errors.push('Invalid JSON format');
      return result;
    }

    if (!validateExportData(data)) {
      result.errors.push('Invalid backup format: data does not match expected structure');
      return result;
    }

    // If replace mode, clear all existing data first
    if (mode === 'replace') {
      clearAllData();
    }

    // Import all data within a single transaction for atomicity
    ydoc.transact(() => {
      // Import parts
      for (const part of data.parts) {
        try {
          if (mode === 'merge') {
            const existing = getPart(part.id);
            if (existing) {
              // Update existing part
              updatePart(part.id, part);
            } else {
              // Add new part (without triggering money supply update in merge mode)
              addPart(part);
            }
          } else {
            // Replace mode - just add
            addPart(part);
          }
          result.partsImported++;
        } catch (e) {
          result.errors.push(`Failed to import part ${part.id}: ${e}`);
        }
      }

      // Import commitments
      for (const commitment of data.commitments) {
        try {
          if (mode === 'merge') {
            const existing = getCommitment(commitment.id);
            if (existing) {
              updateCommitment(commitment.id, commitment);
            } else {
              addCommitment(commitment);
            }
          } else {
            addCommitment(commitment);
          }
          result.commitmentsImported++;
        } catch (e) {
          result.errors.push(`Failed to import commitment ${commitment.id}: ${e}`);
        }
      }

      // Import transactions (always append, no merge logic for transactions)
      if (mode === 'replace') {
        // In replace mode, transactions were already cleared
        for (const transaction of data.transactions) {
          try {
            addTransaction(transaction);
            result.transactionsImported++;
          } catch (e) {
            result.errors.push(`Failed to import transaction ${transaction.id}: ${e}`);
          }
        }
      } else {
        // In merge mode, check for duplicates by ID
        const existingIds = new Set(getAllTransactions().map((t) => t.id));
        for (const transaction of data.transactions) {
          try {
            if (!existingIds.has(transaction.id)) {
              addTransaction(transaction);
              result.transactionsImported++;
            }
          } catch (e) {
            result.errors.push(`Failed to import transaction ${transaction.id}: ${e}`);
          }
        }
      }

      // Import credit events (same logic as transactions)
      if (mode === 'replace') {
        for (const event of data.creditEvents) {
          try {
            addCreditEvent(event);
            result.creditEventsImported++;
          } catch (e) {
            result.errors.push(`Failed to import credit event ${event.id}: ${e}`);
          }
        }
      } else {
        const existingEventIds = new Set(getAllCreditEvents().map((e) => e.id));
        for (const event of data.creditEvents) {
          try {
            if (!existingEventIds.has(event.id)) {
              addCreditEvent(event);
              result.creditEventsImported++;
            }
          } catch (e) {
            result.errors.push(`Failed to import credit event ${event.id}: ${e}`);
          }
        }
      }

      // Update central bank (always replace central bank state)
      try {
        updateCentralBank(data.centralBank);
      } catch (e) {
        result.errors.push(`Failed to import central bank state: ${e}`);
      }
    });

    result.success = result.errors.length === 0;
    return result;
  } catch (e) {
    result.errors.push(`Unexpected error during import: ${e}`);
    return result;
  }
}

/**
 * Get a summary of the current data for display
 */
export function getDataSummary(): {
  partsCount: number;
  commitmentsCount: number;
  transactionsCount: number;
  creditEventsCount: number;
} {
  return {
    partsCount: getAllParts().length,
    commitmentsCount: getAllCommitments().length,
    transactionsCount: getAllTransactions().length,
    creditEventsCount: getAllCreditEvents().length,
  };
}
