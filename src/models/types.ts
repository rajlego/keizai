// Core entity types
export type CommitmentStatus = 'active' | 'completed' | 'failed';
export type TransactionType =
  | 'task_reward'
  | 'transfer'
  | 'bonus'
  | 'penalty';

export type View = 'dashboard' | 'game' | 'parts' | 'commitments' | 'bank' | 'history' | 'settings' | 'journal' | 'writing';

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
  // Trust regeneration
  lastTrustRegenAt?: string; // Timestamp of last trust regeneration
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
  // Per-part trust regeneration
  enablePartTrustRegen: boolean;
  partTrustRegenRate: number; // Credits per hour per part

  // Notification settings
  notificationsEnabled: boolean;
  notifyHoursBeforeDeadline: number[];
  aggressiveNotifications: boolean;

  // Appearance settings
  theme: 'pixel' | 'skyrim' | 'cozy' | 'dark' | 'light';

  // Sync settings
  cloudSyncEnabled: boolean;

  // API Keys
  falApiKey?: string;
  claudeApiKey?: string;
  elevenLabsApiKey?: string;

  // Voice settings
  voiceEnabled: boolean;
  voiceVolume: number;

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
  // Per-part trust regeneration
  enablePartTrustRegen: true,
  partTrustRegenRate: 5, // 5 credits per hour per part

  // Notifications
  notificationsEnabled: true,
  notifyHoursBeforeDeadline: [24, 8, 1],
  aggressiveNotifications: true,

  // Appearance
  theme: 'pixel',

  // Sync
  cloudSyncEnabled: false,

  // Voice
  voiceEnabled: false,
  voiceVolume: 1.0,

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

// ============================================
// BATTLE SYSTEM TYPES
// ============================================

// Hero archetype categories (Fate-inspired)
export type HeroArchetype =
  | 'saber'      // Noble warrior, direct confrontation
  | 'archer'     // Strategic, long-range support
  | 'lancer'     // Aggressive, breakthrough specialist
  | 'caster'     // Wise, insight/magic based
  | 'rider'      // Adaptive, journey-focused
  | 'assassin'   // Precision, shadow work
  | 'berserker'  // Raw power, emotional intensity
  | 'shielder'   // Protection, boundaries
  | 'ruler'      // Balance, judgment, integration
  | 'custom';    // AI-generated or historical figure

// Battle character (villain, hero, or part)
export interface BattleCharacter {
  id: string;
  name: string;
  role: 'villain' | 'hero' | 'part';
  archetype?: HeroArchetype;

  // Stats
  health: number;
  maxHealth: number;
  understanding: number;  // For integration victory (0-100)
  trust: number;          // For negotiation victory (0-100)

  // Personality
  description: string;
  traits: string[];
  coreNeed: string;
  speechStyle: string;

  // Links
  partId?: string;        // If role='part', links to user's Part
  historicalFigure?: string;

  // Generated assets
  avatarUrl?: string;
  avatarPrompt?: string;
  voiceId?: string;       // ElevenLabs voice ID

  createdAt: string;
}

// Battle action types
export type BattleActionType =
  | 'attack'      // Direct confrontation, damages HP
  | 'defend'      // Protect self/ally
  | 'support'     // Buff ally, heal, encourage
  | 'negotiate'   // Try to reach agreement (+trust)
  | 'understand'  // Explore villain's need (+understanding)
  | 'special';    // Archetype-specific ability

export interface BattleAction {
  id: string;
  round: number;
  characterId: string;
  targetId?: string;
  actionType: BattleActionType;
  dialogue: string;       // What they say
  narration: string;      // What happens

  // Effects
  damage?: number;
  healing?: number;
  trustDelta?: number;
  understandingDelta?: number;

  timestamp: string;
}

// Victory types
export type VictoryType =
  | 'hp_depletion'   // Villain HP reaches 0
  | 'integration'    // Understanding reaches 100
  | 'negotiation'    // Trust reaches 100
  | 'defeat'         // All heroes/parts defeated
  | 'flee';          // User chose to retreat

// Battle status
export type BattleStatus = 'setup' | 'summoning' | 'active' | 'paused' | 'completed';

// Main battle state
export interface Battle {
  id: string;

  // Setup
  scenario: string;
  scenarioAnalysis?: string;

  // Participants
  villain: BattleCharacter;
  heroes: BattleCharacter[];
  partIds: string[];        // User's parts involved

  // State
  status: BattleStatus;
  currentRound: number;
  currentActorId: string;
  turnOrder: string[];

  // Battle log
  actions: BattleAction[];
  conversationId: string;

  // Outcome
  victoryType?: VictoryType;
  rewards?: BattleReward[];

  createdAt: string;
  completedAt?: string;
}

export interface BattleReward {
  type: 'xp' | 'currency' | 'ability' | 'insight';
  partId?: string;
  amount?: number;
  description: string;
}

// Hero archetype definitions
export interface HeroArchetypeDefinition {
  name: string;
  description: string;
  traits: string[];
  specialAbility: string;
  voiceStyle: string;
  avatarPrompt: string;
}

export const HERO_ARCHETYPES: Record<HeroArchetype, HeroArchetypeDefinition> = {
  saber: {
    name: 'Saber',
    description: 'Noble warrior who faces challenges with honor and directness',
    traits: ['noble', 'direct', 'honorable', 'protective'],
    specialAbility: 'Excalibur Strike - powerful direct confrontation that cuts through denial',
    voiceStyle: 'commanding yet compassionate',
    avatarPrompt: 'noble knight in shining armor, sword raised, determined expression, pixel art style',
  },
  archer: {
    name: 'Archer',
    description: 'Strategic thinker who sees the bigger picture and hidden patterns',
    traits: ['analytical', 'patient', 'precise', 'independent'],
    specialAbility: 'Unlimited Insight - reveal hidden truths and motivations',
    voiceStyle: 'calm and measured with dry wit',
    avatarPrompt: 'mysterious archer in red cloak, analytical gaze, bow drawn, pixel art style',
  },
  lancer: {
    name: 'Lancer',
    description: 'Aggressive breakthrough specialist who pushes through obstacles',
    traits: ['aggressive', 'passionate', 'loyal', 'impulsive'],
    specialAbility: 'Gae Bolg - pierce through defenses and reach the heart of the matter',
    voiceStyle: 'energetic and passionate, with fierce loyalty',
    avatarPrompt: 'fierce warrior with long spear, dynamic pose, intense eyes, pixel art style',
  },
  caster: {
    name: 'Caster',
    description: 'Wise sage who uses knowledge and insight as power',
    traits: ['wise', 'knowledgeable', 'patient', 'nurturing'],
    specialAbility: 'Territory of Understanding - create safe space for dialogue',
    voiceStyle: 'gentle and wise, like a caring mentor',
    avatarPrompt: 'wise mage with flowing robes, staff with glowing crystal, kind eyes, pixel art style',
  },
  rider: {
    name: 'Rider',
    description: 'Adaptive traveler who navigates journeys and transformations',
    traits: ['adaptive', 'charismatic', 'adventurous', 'free-spirited'],
    specialAbility: 'Gordian Wheel - navigate through complex situations with ease',
    voiceStyle: 'confident and adventurous, inspiring courage',
    avatarPrompt: 'charismatic rider on mystical mount, windswept hair, adventurous spirit, pixel art style',
  },
  assassin: {
    name: 'Assassin',
    description: 'Precision specialist who does shadow work and reveals hidden truths',
    traits: ['stealthy', 'observant', 'patient', 'precise'],
    specialAbility: 'Presence Concealment - work on subconscious patterns unseen',
    voiceStyle: 'quiet and precise, speaking only when necessary',
    avatarPrompt: 'shadowy figure in dark cloak, piercing eyes, mysterious aura, pixel art style',
  },
  berserker: {
    name: 'Berserker',
    description: 'Raw power who channels emotional intensity into transformative force',
    traits: ['powerful', 'emotional', 'primal', 'unstoppable'],
    specialAbility: 'Mad Enhancement - overwhelming emotional breakthrough',
    voiceStyle: 'intense and raw, speaking from pure emotion',
    avatarPrompt: 'powerful berserker with wild hair, glowing eyes, raw emotional energy, pixel art style',
  },
  shielder: {
    name: 'Shielder',
    description: 'Guardian who creates safety and maintains boundaries',
    traits: ['protective', 'steadfast', 'patient', 'selfless'],
    specialAbility: 'Lord Camelot - impenetrable emotional shield',
    voiceStyle: 'warm and reassuring, steady presence',
    avatarPrompt: 'armored guardian with massive shield, protective stance, gentle face, pixel art style',
  },
  ruler: {
    name: 'Ruler',
    description: 'Arbiter of balance who seeks integration and fairness',
    traits: ['balanced', 'fair', 'integrative', 'authoritative'],
    specialAbility: 'True Judgment - facilitate understanding between all parties',
    voiceStyle: 'authoritative but fair, mediator tone',
    avatarPrompt: 'regal figure in ceremonial robes, scales of justice, serene expression, pixel art style',
  },
  custom: {
    name: 'Custom',
    description: 'Unique hero generated for this specific battle',
    traits: [],
    specialAbility: 'Unique ability based on their nature',
    voiceStyle: 'varies based on character',
    avatarPrompt: 'heroic figure, unique design, pixel art style',
  },
};

// ============================================
// CHARACTER EVOLUTION SYSTEM
// ============================================

// Categories for character insights
export type InsightCategory =
  | 'fear'         // What the character fears
  | 'need'         // Core needs and desires
  | 'strength'     // Positive qualities discovered
  | 'trigger'      // What activates this part
  | 'history'      // Backstory elements
  | 'relationship' // Relationships with other parts
  | 'growth';      // Personal development moments

// Source of the insight
export type InsightSource = 'conversation' | 'battle' | 'journal' | 'manual';

// An insight learned about a character from conversations
export interface CharacterInsight {
  id: string;
  characterType: 'part' | 'hero' | 'villain';
  characterId: string;       // Part ID, hero name, or villain ID
  characterName: string;

  // The insight content
  insight: string;           // "Fears being abandoned when others succeed"
  source: InsightSource;
  sourceId?: string;         // Conversation ID, battle ID, journal entry ID

  // Categorization
  category: InsightCategory;

  createdAt: string;
  confirmedByUser: boolean;  // User can confirm or reject AI-generated insights
}

// Character profile that evolves over time
export interface CharacterProfile {
  characterType: 'part' | 'hero';
  characterId: string;
  characterName: string;

  // Core stable info (from original definition)
  baseDescription: string;
  baseTraits: string[];

  // Evolving info (updated from insights)
  evolvedDescription?: string;    // AI-generated synthesis of insights
  discoveredTraits: string[];     // New traits discovered through conversations
  insightIds: string[];           // IDs of related CharacterInsight entries

  lastUpdatedAt: string;
}

// ============================================
// IFS DIALOG JOURNAL SYSTEM
// ============================================

// Hero categories for organizing available heroes
export type HeroCategory =
  | 'philosophers'
  | 'mythology'
  | 'warriors'
  | 'healers'
  | 'literary'
  | 'modern';

// A line of dialog in a journal entry
export interface JournalDialogLine {
  id: string;
  speaker: 'user' | 'part';
  partId?: string;           // If speaker is 'part'
  partName?: string;         // Display name
  content: string;
  emotion?: string;          // "frustrated", "scared", "hopeful"
}

// Advice from a hero consulted in the journal
export interface HeroAdvice {
  id: string;
  heroName: string;          // "Marcus Aurelius", "Athena", etc.
  heroCategory: HeroCategory;

  // The advice
  advice: string;            // The hero's response in character
  keyInsight: string;        // One-line summary
  suggestedAction?: string;  // Practical suggestion

  // Metadata
  requestedAt: string;
  helpful?: boolean;         // User feedback
}

// A journal entry with IFS dialog
export interface JournalEntry {
  id: string;
  title: string;

  // The user-written dialog
  dialog: JournalDialogLine[];

  // Context/description
  situation?: string;        // "I was feeling overwhelmed at work..."
  question?: string;         // "How can I resolve this conflict?"

  // Hero consultations
  heroAdvice: HeroAdvice[];

  // Outcomes
  resolution?: string;       // User's reflection on what they learned
  insightIds: string[];      // CharacterInsight IDs generated from this entry

  createdAt: string;
  updatedAt: string;
}

// ============================================
// WRITING MODE - Freeform writing with hero commentary
// ============================================

// Commentary from a hero on user's writing
export interface HeroCommentary {
  id: string;
  heroName: string;
  heroCategory: HeroCategory;

  // The commentary content
  commentary: string;       // The hero's thoughts on the writing (2-3 paragraphs)
  highlightedQuote?: string; // A specific quote from the writing they're responding to
  keyReflection: string;    // One sentence summary of their main point
  questionToConsider?: string; // A question for the writer to ponder

  // Metadata
  requestedAt: string;
  helpful?: boolean;        // User feedback
}

// A writing entry - freeform journaling/logging
export interface WritingEntry {
  id: string;
  title: string;

  // The actual writing
  content: string;          // Freeform text content
  wordCount: number;        // Tracked for stats

  // Optional metadata
  mood?: string;            // How the writer was feeling
  tags?: string[];          // User-defined tags

  // Hero commentaries
  commentaries: HeroCommentary[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
