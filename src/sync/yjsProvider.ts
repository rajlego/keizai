import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { Part, Loan, Commitment, Transaction, CentralBank, CreditScoreEvent } from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';

// Single Yjs document - source of truth for all synced data
export const ydoc = new Y.Doc();

// Data structures
export const partsMap = ydoc.getMap<Part>('parts');
export const loansMap = ydoc.getMap<Loan>('loans');
export const transactionsArray = ydoc.getArray<Transaction>('transactions');
export const centralBankMap = ydoc.getMap<unknown>('centralBank');
export const creditEventsArray = ydoc.getArray<CreditScoreEvent>('creditEvents');

let localPersistence: IndexeddbPersistence | null = null;

// Initialize local persistence with IndexedDB
export function initLocalPersistence(docName: string = 'keizai-data'): Promise<void> {
  return new Promise((resolve) => {
    localPersistence = new IndexeddbPersistence(docName, ydoc);
    localPersistence.on('synced', () => {
      console.log('[Yjs] Local data loaded from IndexedDB');
      initializeCentralBankIfNeeded();
      resolve();
    });
  });
}

// Initialize central bank with defaults if it doesn't exist
function initializeCentralBankIfNeeded(): void {
  if (centralBankMap.size === 0) {
    ydoc.transact(() => {
      centralBankMap.set('balance', DEFAULT_SETTINGS.centralBankStartingBalance);
      centralBankMap.set('baseInterestRate', DEFAULT_SETTINGS.baseInterestRate);
      centralBankMap.set('lastRegenAt', new Date().toISOString());
      centralBankMap.set('totalMoneySupply', DEFAULT_SETTINGS.centralBankStartingBalance);
    });
  }
}

// Get central bank state
export function getCentralBank(): CentralBank {
  return {
    balance: (centralBankMap.get('balance') as number) ?? DEFAULT_SETTINGS.centralBankStartingBalance,
    baseInterestRate: (centralBankMap.get('baseInterestRate') as number) ?? DEFAULT_SETTINGS.baseInterestRate,
    lastRegenAt: (centralBankMap.get('lastRegenAt') as string) ?? new Date().toISOString(),
    totalMoneySupply: (centralBankMap.get('totalMoneySupply') as number) ?? DEFAULT_SETTINGS.centralBankStartingBalance,
  };
}

// Update central bank
export function updateCentralBank(updates: Partial<CentralBank>): void {
  ydoc.transact(() => {
    if (updates.balance !== undefined) centralBankMap.set('balance', updates.balance);
    if (updates.baseInterestRate !== undefined) centralBankMap.set('baseInterestRate', updates.baseInterestRate);
    if (updates.lastRegenAt !== undefined) centralBankMap.set('lastRegenAt', updates.lastRegenAt);
    if (updates.totalMoneySupply !== undefined) centralBankMap.set('totalMoneySupply', updates.totalMoneySupply);
  });
}

// Parts CRUD
export function getAllParts(): Part[] {
  return Array.from(partsMap.values());
}

export function getPart(id: string): Part | undefined {
  return partsMap.get(id);
}

export function addPart(part: Part): void {
  ydoc.transact(() => {
    partsMap.set(part.id, part);
    // Update total money supply
    const bank = getCentralBank();
    updateCentralBank({ totalMoneySupply: bank.totalMoneySupply + part.balance });
  });
}

export function updatePart(id: string, updates: Partial<Part>): void {
  const existing = partsMap.get(id);
  if (!existing) return;

  ydoc.transact(() => {
    partsMap.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function deletePart(id: string): void {
  ydoc.transact(() => {
    partsMap.delete(id);
  });
}

// Commitments CRUD (loansMap stores commitments for backward compatibility)
export function getAllCommitments(): Commitment[] {
  return Array.from(loansMap.values()) as Commitment[];
}

export function getCommitment(id: string): Commitment | undefined {
  return loansMap.get(id) as Commitment | undefined;
}

export function addCommitment(commitment: Commitment): void {
  ydoc.transact(() => {
    loansMap.set(commitment.id, commitment as unknown as Loan);
  });
}

export function updateCommitment(id: string, updates: Partial<Commitment>): void {
  const existing = loansMap.get(id);
  if (!existing) return;

  ydoc.transact(() => {
    loansMap.set(id, {
      ...existing,
      ...updates,
    } as Loan);
  });
}

// Legacy aliases for backward compatibility
export const getAllLoans = getAllCommitments;
export const getLoan = getCommitment;
export const addLoan = addCommitment as (loan: Loan) => void;
export const updateLoan = updateCommitment as (id: string, updates: Partial<Loan>) => void;

// Transactions
export function getAllTransactions(): Transaction[] {
  return transactionsArray.toArray();
}

export function addTransaction(transaction: Transaction): void {
  ydoc.transact(() => {
    transactionsArray.push([transaction]);
  });
}

// Credit events
export function getAllCreditEvents(): CreditScoreEvent[] {
  return creditEventsArray.toArray();
}

export function addCreditEvent(event: CreditScoreEvent): void {
  ydoc.transact(() => {
    creditEventsArray.push([event]);
  });
}

// Subscribe to changes
export function onPartsChange(callback: (parts: Part[]) => void): () => void {
  const handler = () => callback(getAllParts());
  partsMap.observeDeep(handler);
  return () => partsMap.unobserveDeep(handler);
}

export function onCommitmentsChange(callback: (commitments: Commitment[]) => void): () => void {
  const handler = () => callback(getAllCommitments());
  loansMap.observeDeep(handler);
  return () => loansMap.unobserveDeep(handler);
}

// Legacy alias
export const onLoansChange = onCommitmentsChange as (callback: (loans: Loan[]) => void) => () => void;

export function onTransactionsChange(callback: (transactions: Transaction[]) => void): () => void {
  const handler = () => callback(getAllTransactions());
  transactionsArray.observeDeep(handler);
  return () => transactionsArray.unobserveDeep(handler);
}

export function onCentralBankChange(callback: (bank: CentralBank) => void): () => void {
  const handler = () => callback(getCentralBank());
  centralBankMap.observeDeep(handler);
  return () => centralBankMap.unobserveDeep(handler);
}

// Clear all data (for testing/reset)
export function clearAllData(): void {
  ydoc.transact(() => {
    partsMap.clear();
    loansMap.clear();
    while (transactionsArray.length > 0) {
      transactionsArray.delete(0, transactionsArray.length);
    }
    while (creditEventsArray.length > 0) {
      creditEventsArray.delete(0, creditEventsArray.length);
    }
    centralBankMap.clear();
    initializeCentralBankIfNeeded();
  });
}
