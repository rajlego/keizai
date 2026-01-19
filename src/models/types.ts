// Core entity types
export type CommitmentStatus = 'active' | 'completed' | 'failed';
export type TransactionType =
  | 'task_reward'
  | 'transfer'
  | 'bonus'
  | 'penalty';

export type View = 'dashboard' | 'parts' | 'commitments' | 'bank' | 'history' | 'settings';

// Legacy alias for migration
export type LoanStatus = CommitmentStatus;

// Part - represents an IFS part with financial attributes
export interface Part {
  id: string;
  name: string;
  avatarUrl?: string;
  avatarPrompt?: string;
  balance: number;
  creditScore: number;
  createdAt: string;
  updatedAt: string;
}

// Commitment Task - things a part commits to doing
export interface CommitmentTask {
  id: string;
  description: string;
  reward: number; // How much completing this task pays
  isCompleted: boolean;
  completedAt?: string;
}

// Legacy alias
export type RepaymentTask = CommitmentTask & { creditValue?: number };

// Commitment - a part's promise to complete tasks for rewards
export interface Commitment {
  id: string;
  partId: string; // The part making the commitment
  funderId: string; // Who pays for completed tasks (usually 'central_bank')

  // Tasks to complete
  tasks: CommitmentTask[];
  description: string; // Overall description of commitment

  // Timeline
  createdAt: string;
  deadline: string;
  completedAt?: string;
  failedAt?: string;

  // Status
  status: CommitmentStatus;

  // Notification tracking
  lastNotificationAt?: string;
  notificationCount: number;
}

// Legacy alias for migration
export type Loan = Commitment & {
  borrowerId?: string;
  lenderId?: string;
  principal?: number;
  interestRate?: number;
  currentBalance?: number;
  purpose?: string;
  requestedAt?: string;
  approvedAt?: string;
  repaidAt?: string;
  defaultedAt?: string;
};

// Transaction - ledger of all money movements
export interface Transaction {
  id: string;
  fromId: string; // Part ID, 'central_bank', or 'system'
  toId: string;
  amount: number;
  type: TransactionType;
  commitmentId?: string;
  taskId?: string;
  description: string;
  createdAt: string;
}

// Legacy alias
export type { Transaction as TransactionWithLoanId };

// Central Bank state
export interface CentralBank {
  balance: number;
  baseInterestRate: number;
  lastRegenAt: string;
  totalMoneySupply: number;
}

// Credit Score History Event
export interface CreditScoreEvent {
  id: string;
  partId: string;
  previousScore: number;
  newScore: number;
  change: number;
  reason: string;
  commitmentId?: string;
  createdAt: string;
}

// Application Settings
export interface KeizaiSettings {
  startingBalance: number;
  centralBankStartingBalance: number;
  centralBankRegenRate: number;
  baseInterestRate: number;
  startingCreditScore: number;
  minCreditScore: number;
  maxCreditScore: number;
  notificationsEnabled: boolean;
  notifyHoursBeforeDeadline: number[];
  aggressiveNotifications: boolean;
  theme: 'pixel' | 'cozy' | 'dark' | 'light';
  cloudSyncEnabled: boolean;
  falApiKey?: string;
}

// Default settings
export const DEFAULT_SETTINGS: KeizaiSettings = {
  startingBalance: 1000,
  centralBankStartingBalance: 10000,
  centralBankRegenRate: 100,
  baseInterestRate: 0.15,
  startingCreditScore: 650,
  minCreditScore: 300,
  maxCreditScore: 850,
  notificationsEnabled: true,
  notifyHoursBeforeDeadline: [24, 8, 1],
  aggressiveNotifications: true,
  theme: 'pixel',
  cloudSyncEnabled: false,
};

// Central bank identifier constant
export const CENTRAL_BANK_ID = 'central_bank';
