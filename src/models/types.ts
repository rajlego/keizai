// Core entity types
export type CommitmentStatus = 'active' | 'completed' | 'failed';
export type TransactionType =
  | 'task_reward'
  | 'transfer'
  | 'bonus'
  | 'penalty';

export type View = 'dashboard' | 'game' | 'parts' | 'commitments' | 'bank' | 'history' | 'settings';

// Game style options
export type GameStyle = 'visual-novel' | 'persona-hub' | 'top-down-rpg' | 'point-click';

// Part mood states
export type PartMood = 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited' | 'angry';

// Conversation context types
export type ConversationContext = 'casual' | 'loan-request' | 'negotiation' | 'debate' | 'celebration';

// Pending request types
export type RequestType = 'loan' | 'complaint' | 'celebration' | 'debate' | 'question';

// Request urgency levels
export type RequestUrgency = 'low' | 'medium' | 'high';

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
  // Economy settings
  startingBalance: number;
  centralBankStartingBalance: number;
  centralBankRegenRate: number;
  baseInterestRate: number;
  startingCreditScore: number;
  minCreditScore: number;
  maxCreditScore: number;

  // Notification settings
  notificationsEnabled: boolean;
  notifyHoursBeforeDeadline: number[];
  aggressiveNotifications: boolean;

  // Appearance settings
  theme: 'pixel' | 'cozy' | 'dark' | 'light';

  // Sync settings
  cloudSyncEnabled: boolean;

  // API Keys
  falApiKey?: string;
  claudeApiKey?: string;

  // Game settings
  gameStyle: GameStyle;
  autoGeneratePersonalities: boolean;
  showRelationshipLevels: boolean;
  enablePartInitiatedConversations: boolean;
  narratorEnabled: boolean;
}

// Default settings
export const DEFAULT_SETTINGS: KeizaiSettings = {
  // Economy
  startingBalance: 1000,
  centralBankStartingBalance: 10000,
  centralBankRegenRate: 100,
  baseInterestRate: 0.15,
  startingCreditScore: 650,
  minCreditScore: 300,
  maxCreditScore: 850,

  // Notifications
  notificationsEnabled: true,
  notifyHoursBeforeDeadline: [24, 8, 1],
  aggressiveNotifications: true,

  // Appearance
  theme: 'pixel',

  // Sync
  cloudSyncEnabled: false,

  // Game
  gameStyle: 'persona-hub',
  autoGeneratePersonalities: true,
  showRelationshipLevels: true,
  enablePartInitiatedConversations: true,
  narratorEnabled: true,
};

// Central bank identifier constant
export const CENTRAL_BANK_ID = 'central_bank';

// ============================================
// GAME SYSTEM TYPES
// ============================================

// Part personality for LLM roleplay
export interface PartPersonality {
  partId: string;
  traits: string[];              // ["anxious", "perfectionist", "caring"]
  speechStyle: string;           // "speaks in short, nervous sentences"
  coreNeed: string;              // "needs to feel safe and prepared"
  customNotes: string;           // User-written details
  voicePitch?: 'low' | 'medium' | 'high';  // For TTS future
  createdAt: string;
  updatedAt: string;
}

// Conversation message
export interface ConversationMessage {
  id: string;
  role: 'user' | 'part' | 'system' | 'narrator';
  content: string;
  partId?: string;               // Which part spoke (if role='part')
  emotion?: string;              // For portrait expressions
  timestamp: string;
}

// Conversation thread
export interface Conversation {
  id: string;
  participantIds: string[];      // Part IDs involved
  messages: ConversationMessage[];
  context: ConversationContext;
  createdAt: string;
  lastMessageAt: string;
}

// Social link / relationship
export interface Relationship {
  id: string;
  partId: string;
  level: number;                 // 1-10 Persona-style
  experience: number;            // Points toward next level
  title: string;                 // "Stranger" -> "Confidant" -> "Integrated"
  unlockedAbilities: string[];   // Special dialogue options
  flags: Record<string, boolean>;// Story flags
  lastInteractionAt: string;
}

// Relationship level titles
export const RELATIONSHIP_TITLES: Record<number, string> = {
  1: 'Stranger',
  2: 'Acquaintance',
  3: 'Familiar',
  4: 'Friend',
  5: 'Close Friend',
  6: 'Trusted',
  7: 'Confidant',
  8: 'Ally',
  9: 'Bonded',
  10: 'Integrated',
};

// XP required for each relationship level
export const RELATIONSHIP_XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 800,
  6: 1200,
  7: 1700,
  8: 2300,
  9: 3000,
  10: 4000,
};

// Pending interaction request from a part
export interface PendingRequest {
  type: RequestType;
  targetPartId?: string;         // For debates
  urgency: RequestUrgency;
  summary: string;
  createdAt: string;
}

// Part's state in game world
export interface PartGameState {
  partId: string;
  position: { x: number; y: number };  // Percentage (0-100) or grid coords
  mood: PartMood;
  expression: string;                   // For portraits
  isAvailable: boolean;
  pendingRequest?: PendingRequest;
  currentScene?: string;                // For point-click
}

// Player state in game world
export interface PlayerState {
  position: { x: number; y: number };
  currentScene: string;
  inventory?: string[];          // For point-click style
}

// Overall game state
export interface GameState {
  playerState: PlayerState;
  partStates: PartGameState[];
  activeConversationId: string | null;
  isDialogueOpen: boolean;
}
