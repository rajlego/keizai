import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type {
  Part,
  Loan,
  Commitment,
  Transaction,
  CentralBank,
  CreditScoreEvent,
  PartPersonality,
  Conversation,
  Relationship,
  PartGameState,
  PlayerState,
  GameState,
  Battle,
  BattleCharacter,
  BattleAction,
  CharacterInsight,
  CharacterProfile,
  JournalEntry,
  WritingEntry,
  HeroCommentary,
} from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';

// Single Yjs document - source of truth for all synced data
export const ydoc = new Y.Doc();

// Data structures - Core
export const partsMap = ydoc.getMap<Part>('parts');
export const loansMap = ydoc.getMap<Loan>('loans');
export const transactionsArray = ydoc.getArray<Transaction>('transactions');
export const centralBankMap = ydoc.getMap<unknown>('centralBank');
export const creditEventsArray = ydoc.getArray<CreditScoreEvent>('creditEvents');

// Data structures - Game System
export const personalitiesMap = ydoc.getMap<PartPersonality>('personalities');
export const conversationsMap = ydoc.getMap<Conversation>('conversations');
export const relationshipsMap = ydoc.getMap<Relationship>('relationships');
export const gameStateMap = ydoc.getMap<unknown>('gameState');

// Data structures - Battle System
export const battlesMap = ydoc.getMap<Battle>('battles');
export const battleCharactersMap = ydoc.getMap<BattleCharacter>('battleCharacters');

// Data structures - Character Evolution & Journal System
export const insightsMap = ydoc.getMap<CharacterInsight>('insights');
export const profilesMap = ydoc.getMap<CharacterProfile>('characterProfiles');
export const journalMap = ydoc.getMap<JournalEntry>('journal');

// Data structures - Writing Mode
export const writingMap = ydoc.getMap<WritingEntry>('writing');

let localPersistence: IndexeddbPersistence | null = null;

// Clear IndexedDB data (for debugging memory leaks)
async function clearIndexedDB(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => {
      console.log(`[Yjs] Cleared IndexedDB: ${dbName}`);
      resolve();
    };
    request.onerror = () => {
      console.error(`[Yjs] Failed to clear IndexedDB: ${dbName}`);
      reject(request.error);
    };
    request.onblocked = () => {
      console.warn(`[Yjs] IndexedDB delete blocked: ${dbName}`);
      resolve();
    };
  });
}

// Log Yjs document stats for memory debugging
function logYjsStats(): void {
  const stats = {
    parts: partsMap.size,
    loans: loansMap.size,
    transactions: transactionsArray.length,
    creditEvents: creditEventsArray.length,
    personalities: personalitiesMap.size,
    conversations: conversationsMap.size,
    relationships: relationshipsMap.size,
    battles: battlesMap.size,
    battleCharacters: battleCharactersMap.size,
    insights: insightsMap.size,
    profiles: profilesMap.size,
    journal: journalMap.size,
    writing: writingMap.size,
  };
  console.log('[Yjs] Document stats:', stats);

  // Warn if arrays are getting large
  if (transactionsArray.length > 1000) {
    console.warn(`[Yjs] transactions array is large: ${transactionsArray.length} items`);
  }
  if (creditEventsArray.length > 1000) {
    console.warn(`[Yjs] creditEvents array is large: ${creditEventsArray.length} items`);
  }
}

// Initialize local persistence with IndexedDB
export async function initLocalPersistence(docName: string = 'keizai-data'): Promise<void> {
  // Check for ?clear query param to reset data (for debugging)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('clear') === 'true') {
    console.warn('[Yjs] Clearing IndexedDB due to ?clear=true parameter');
    await clearIndexedDB(docName);
    // Also clear localStorage
    localStorage.clear();
    console.warn('[Yjs] Cleared localStorage');
    // Remove the query param to prevent re-clearing on refresh
    window.history.replaceState({}, '', window.location.pathname);
  }

  return new Promise((resolve) => {
    localPersistence = new IndexeddbPersistence(docName, ydoc);
    localPersistence.on('synced', () => {
      console.log('[Yjs] Local data loaded from IndexedDB');
      logYjsStats(); // Log stats after loading
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
  ydoc.transact(() => {
    // Read INSIDE transaction to prevent race conditions
    const existing = partsMap.get(id);
    if (!existing) return;

    // Validate balance (prevent negative)
    if (updates.balance !== undefined && updates.balance < 0) {
      console.warn('[Parts] Attempted to set negative balance, clamping to 0');
      updates.balance = 0;
    }

    // Validate credit score (clamp to valid range)
    if (updates.creditScore !== undefined) {
      updates.creditScore = Math.max(300, Math.min(850, updates.creditScore));
    }

    partsMap.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function deletePart(id: string): void {
  // Check if part is in an active battle
  const activeBattle = getActiveBattle();
  if (activeBattle?.partIds.includes(id)) {
    throw new Error('Cannot delete a part that is participating in an active battle');
  }

  ydoc.transact(() => {
    // Delete the part
    partsMap.delete(id);

    // Clean up related data
    personalitiesMap.delete(id);
    relationshipsMap.delete(id);
    profilesMap.delete(id);

    // Clean up insights referencing this part
    for (const [insightId, insight] of insightsMap.entries()) {
      if (insight.characterId === id) {
        insightsMap.delete(insightId);
      }
    }

    // Clean up conversations involving this part
    for (const [convId, conv] of conversationsMap.entries()) {
      if (conv.participantIds.includes(id)) {
        conversationsMap.delete(convId);
      }
    }

    // Clean up journal entries - remove dialog lines from deleted part
    for (const [entryId, entry] of journalMap.entries()) {
      const hasPartDialog = entry.dialog.some(line => line.partId === id);
      if (hasPartDialog) {
        const cleanedDialog = entry.dialog.filter(line => line.partId !== id);
        // If no dialog remains, delete the entry; otherwise update it
        if (cleanedDialog.length === 0 && entry.dialog.length > 0) {
          journalMap.delete(entryId);
        } else if (cleanedDialog.length !== entry.dialog.length) {
          journalMap.set(entryId, {
            ...entry,
            dialog: cleanedDialog,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Clean up commitments/loans tied to this part
    for (const [commitmentId, commitment] of loansMap.entries()) {
      if ((commitment as { partId?: string }).partId === id) {
        loansMap.delete(commitmentId);
      }
    }

    console.log(`[Parts] Deleted part ${id} and cleaned up orphaned references`);
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
// Limit to prevent unbounded memory growth
const MAX_TRANSACTIONS = 500;
const MAX_CREDIT_EVENTS = 500;

export function getAllTransactions(): Transaction[] {
  return transactionsArray.toArray();
}

export function addTransaction(transaction: Transaction): void {
  ydoc.transact(() => {
    transactionsArray.push([transaction]);
    // Trim old transactions if over limit
    if (transactionsArray.length > MAX_TRANSACTIONS) {
      const toRemove = transactionsArray.length - MAX_TRANSACTIONS;
      transactionsArray.delete(0, toRemove);
      console.log(`[Yjs] Trimmed ${toRemove} old transactions`);
    }
  });
}

// Credit events
export function getAllCreditEvents(): CreditScoreEvent[] {
  return creditEventsArray.toArray();
}

export function addCreditEvent(event: CreditScoreEvent): void {
  ydoc.transact(() => {
    creditEventsArray.push([event]);
    // Trim old events if over limit
    if (creditEventsArray.length > MAX_CREDIT_EVENTS) {
      const toRemove = creditEventsArray.length - MAX_CREDIT_EVENTS;
      creditEventsArray.delete(0, toRemove);
      console.log(`[Yjs] Trimmed ${toRemove} old credit events`);
    }
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

// ============================================
// GAME SYSTEM - Personalities
// ============================================

export function getAllPersonalities(): PartPersonality[] {
  return Array.from(personalitiesMap.values());
}

export function getPersonality(partId: string): PartPersonality | undefined {
  return personalitiesMap.get(partId);
}

export function setPersonality(personality: PartPersonality): void {
  ydoc.transact(() => {
    personalitiesMap.set(personality.partId, personality);
  });
}

export function updatePersonality(partId: string, updates: Partial<PartPersonality>): void {
  ydoc.transact(() => {
    // Read INSIDE transaction to prevent race conditions
    const existing = personalitiesMap.get(partId);
    if (!existing) return;

    personalitiesMap.set(partId, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function deletePersonality(partId: string): void {
  ydoc.transact(() => {
    personalitiesMap.delete(partId);
  });
}

export function onPersonalitiesChange(callback: (personalities: PartPersonality[]) => void): () => void {
  const handler = () => callback(getAllPersonalities());
  personalitiesMap.observeDeep(handler);
  return () => personalitiesMap.unobserveDeep(handler);
}

// ============================================
// GAME SYSTEM - Conversations
// ============================================

export function getAllConversations(): Conversation[] {
  return Array.from(conversationsMap.values());
}

export function getConversation(id: string): Conversation | undefined {
  return conversationsMap.get(id);
}

export function getConversationsForPart(partId: string): Conversation[] {
  return getAllConversations().filter(c => c.participantIds.includes(partId));
}

export function addConversation(conversation: Conversation): void {
  ydoc.transact(() => {
    conversationsMap.set(conversation.id, conversation);
  });
}

export function updateConversation(id: string, updates: Partial<Conversation>): void {
  ydoc.transact(() => {
    // Read INSIDE transaction to prevent race conditions
    const existing = conversationsMap.get(id);
    if (!existing) return;

    conversationsMap.set(id, {
      ...existing,
      ...updates,
      lastMessageAt: new Date().toISOString(),
    });
  });
}

export function addMessageToConversation(conversationId: string, message: Conversation['messages'][0]): void {
  const existing = conversationsMap.get(conversationId);
  if (!existing) return;

  ydoc.transact(() => {
    conversationsMap.set(conversationId, {
      ...existing,
      messages: [...existing.messages, message],
      lastMessageAt: new Date().toISOString(),
    });
  });
}

export function deleteConversation(id: string): void {
  ydoc.transact(() => {
    conversationsMap.delete(id);
  });
}

export function onConversationsChange(callback: (conversations: Conversation[]) => void): () => void {
  const handler = () => callback(getAllConversations());
  conversationsMap.observeDeep(handler);
  return () => conversationsMap.unobserveDeep(handler);
}

// ============================================
// GAME SYSTEM - Relationships
// ============================================

export function getAllRelationships(): Relationship[] {
  return Array.from(relationshipsMap.values());
}

export function getRelationship(partId: string): Relationship | undefined {
  return relationshipsMap.get(partId);
}

export function setRelationship(relationship: Relationship): void {
  ydoc.transact(() => {
    relationshipsMap.set(relationship.partId, relationship);
  });
}

export function updateRelationship(partId: string, updates: Partial<Relationship>): void {
  const existing = relationshipsMap.get(partId);
  if (!existing) return;

  ydoc.transact(() => {
    relationshipsMap.set(partId, {
      ...existing,
      ...updates,
      lastInteractionAt: new Date().toISOString(),
    });
  });
}

export function addRelationshipXP(partId: string, xp: number): void {
  const existing = relationshipsMap.get(partId);
  if (!existing) return;

  ydoc.transact(() => {
    relationshipsMap.set(partId, {
      ...existing,
      experience: existing.experience + xp,
      lastInteractionAt: new Date().toISOString(),
    });
  });
}

export function deleteRelationship(partId: string): void {
  ydoc.transact(() => {
    relationshipsMap.delete(partId);
  });
}

export function onRelationshipsChange(callback: (relationships: Relationship[]) => void): () => void {
  const handler = () => callback(getAllRelationships());
  relationshipsMap.observeDeep(handler);
  return () => relationshipsMap.unobserveDeep(handler);
}

// ============================================
// GAME SYSTEM - Game State
// ============================================

const DEFAULT_PLAYER_STATE: PlayerState = {
  position: { x: 50, y: 50 },
  currentScene: 'hub',
  inventory: [],
};

export function getGameState(): GameState {
  return {
    playerState: (gameStateMap.get('playerState') as PlayerState) ?? DEFAULT_PLAYER_STATE,
    partStates: (gameStateMap.get('partStates') as PartGameState[]) ?? [],
    activeConversationId: (gameStateMap.get('activeConversationId') as string | null) ?? null,
    isDialogueOpen: (gameStateMap.get('isDialogueOpen') as boolean) ?? false,
  };
}

export function updateGameState(updates: Partial<GameState>): void {
  ydoc.transact(() => {
    if (updates.playerState !== undefined) gameStateMap.set('playerState', updates.playerState);
    if (updates.partStates !== undefined) gameStateMap.set('partStates', updates.partStates);
    if (updates.activeConversationId !== undefined) gameStateMap.set('activeConversationId', updates.activeConversationId);
    if (updates.isDialogueOpen !== undefined) gameStateMap.set('isDialogueOpen', updates.isDialogueOpen);
  });
}

export function updatePlayerPosition(x: number, y: number): void {
  const current = getGameState();
  updateGameState({
    playerState: {
      ...current.playerState,
      position: { x, y },
    },
  });
}

export function setActiveConversation(conversationId: string | null): void {
  updateGameState({
    activeConversationId: conversationId,
    isDialogueOpen: conversationId !== null,
  });
}

export function updatePartGameState(partId: string, updates: Partial<PartGameState>): void {
  const current = getGameState();
  const partStates = [...current.partStates];
  const index = partStates.findIndex(ps => ps.partId === partId);

  if (index >= 0) {
    partStates[index] = { ...partStates[index], ...updates };
  } else {
    // Create new part game state
    partStates.push({
      partId,
      position: { x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 },
      mood: 'neutral',
      expression: 'default',
      isAvailable: true,
      ...updates,
    });
  }

  updateGameState({ partStates });
}

export function onGameStateChange(callback: (state: GameState) => void): () => void {
  const handler = () => callback(getGameState());
  gameStateMap.observeDeep(handler);
  return () => gameStateMap.unobserveDeep(handler);
}

// ============================================
// BATTLE SYSTEM
// ============================================

export function getAllBattles(): Battle[] {
  return Array.from(battlesMap.values());
}

export function getBattle(id: string): Battle | undefined {
  return battlesMap.get(id);
}

export function getActiveBattle(): Battle | undefined {
  return getAllBattles().find(b => b.status === 'active' || b.status === 'setup' || b.status === 'summoning');
}

export function addBattle(battle: Battle): void {
  ydoc.transact(() => {
    battlesMap.set(battle.id, battle);
    // Also store the villain as a battle character
    battleCharactersMap.set(battle.villain.id, battle.villain);
    // Store all heroes
    for (const hero of battle.heroes) {
      battleCharactersMap.set(hero.id, hero);
    }
  });
}

export function updateBattle(id: string, updates: Partial<Battle>): void {
  const existing = battlesMap.get(id);
  if (!existing) return;

  ydoc.transact(() => {
    battlesMap.set(id, {
      ...existing,
      ...updates,
    });
  });
}

export function addActionToBattle(battleId: string, action: BattleAction): void {
  const existing = battlesMap.get(battleId);
  if (!existing) return;

  ydoc.transact(() => {
    battlesMap.set(battleId, {
      ...existing,
      actions: [...existing.actions, action],
    });
  });
}

export function addHeroToBattle(battleId: string, hero: BattleCharacter): void {
  const existing = battlesMap.get(battleId);
  if (!existing) return;

  ydoc.transact(() => {
    battleCharactersMap.set(hero.id, hero);
    battlesMap.set(battleId, {
      ...existing,
      heroes: [...existing.heroes, hero],
      turnOrder: [...existing.turnOrder, hero.id],
    });
  });
}

export function updateBattleCharacter(characterId: string, updates: Partial<BattleCharacter>): void {
  const existing = battleCharactersMap.get(characterId);
  if (!existing) return;

  ydoc.transact(() => {
    battleCharactersMap.set(characterId, {
      ...existing,
      ...updates,
    });

    // Also update in battle if this is a villain
    for (const battle of getAllBattles()) {
      if (battle.villain.id === characterId) {
        battlesMap.set(battle.id, {
          ...battle,
          villain: { ...battle.villain, ...updates },
        });
      }
      // Or if it's a hero
      const heroIndex = battle.heroes.findIndex(h => h.id === characterId);
      if (heroIndex >= 0) {
        const updatedHeroes = [...battle.heroes];
        updatedHeroes[heroIndex] = { ...updatedHeroes[heroIndex], ...updates };
        battlesMap.set(battle.id, {
          ...battle,
          heroes: updatedHeroes,
        });
      }
    }
  });
}

export function deleteBattle(id: string): void {
  const battle = battlesMap.get(id);
  if (!battle) return;

  ydoc.transact(() => {
    // Delete associated characters
    battleCharactersMap.delete(battle.villain.id);
    for (const hero of battle.heroes) {
      battleCharactersMap.delete(hero.id);
    }
    battlesMap.delete(id);
  });
}

export function getAllBattleCharacters(): BattleCharacter[] {
  return Array.from(battleCharactersMap.values());
}

export function getBattleCharacter(id: string): BattleCharacter | undefined {
  return battleCharactersMap.get(id);
}

export function onBattlesChange(callback: (battles: Battle[]) => void): () => void {
  const handler = () => callback(getAllBattles());
  battlesMap.observeDeep(handler);
  return () => battlesMap.unobserveDeep(handler);
}

export function onBattleCharactersChange(callback: (characters: BattleCharacter[]) => void): () => void {
  const handler = () => callback(getAllBattleCharacters());
  battleCharactersMap.observeDeep(handler);
  return () => battleCharactersMap.unobserveDeep(handler);
}

// ============================================
// CHARACTER EVOLUTION - Insights
// ============================================

export function getAllInsights(): CharacterInsight[] {
  return Array.from(insightsMap.values());
}

export function getInsight(id: string): CharacterInsight | undefined {
  return insightsMap.get(id);
}

export function getInsightsForCharacter(characterId: string): CharacterInsight[] {
  return getAllInsights().filter(i => i.characterId === characterId);
}

export function getUnconfirmedInsights(): CharacterInsight[] {
  return getAllInsights().filter(i => !i.confirmedByUser);
}

export function addInsight(insight: CharacterInsight): void {
  ydoc.transact(() => {
    insightsMap.set(insight.id, insight);
  });
}

export function updateInsight(id: string, updates: Partial<CharacterInsight>): void {
  const existing = insightsMap.get(id);
  if (!existing) return;

  ydoc.transact(() => {
    insightsMap.set(id, {
      ...existing,
      ...updates,
    });
  });
}

export function confirmInsight(id: string): void {
  updateInsight(id, { confirmedByUser: true });
}

export function rejectInsight(id: string): void {
  ydoc.transact(() => {
    insightsMap.delete(id);
  });
}

export function deleteInsight(id: string): void {
  ydoc.transact(() => {
    insightsMap.delete(id);
  });
}

export function onInsightsChange(callback: (insights: CharacterInsight[]) => void): () => void {
  const handler = () => callback(getAllInsights());
  insightsMap.observeDeep(handler);
  return () => insightsMap.unobserveDeep(handler);
}

// ============================================
// CHARACTER EVOLUTION - Profiles
// ============================================

export function getAllProfiles(): CharacterProfile[] {
  return Array.from(profilesMap.values());
}

export function getProfile(characterId: string): CharacterProfile | undefined {
  return profilesMap.get(characterId);
}

export function addProfile(profile: CharacterProfile): void {
  ydoc.transact(() => {
    profilesMap.set(profile.characterId, profile);
  });
}

export function updateProfile(characterId: string, updates: Partial<CharacterProfile>): void {
  const existing = profilesMap.get(characterId);
  if (!existing) return;

  ydoc.transact(() => {
    profilesMap.set(characterId, {
      ...existing,
      ...updates,
      lastUpdatedAt: new Date().toISOString(),
    });
  });
}

export function addInsightToProfile(characterId: string, insightId: string): void {
  const existing = profilesMap.get(characterId);
  if (!existing) return;

  if (existing.insightIds.includes(insightId)) return;

  ydoc.transact(() => {
    profilesMap.set(characterId, {
      ...existing,
      insightIds: [...existing.insightIds, insightId],
      lastUpdatedAt: new Date().toISOString(),
    });
  });
}

export function addDiscoveredTrait(characterId: string, trait: string): void {
  const existing = profilesMap.get(characterId);
  if (!existing) return;

  if (existing.discoveredTraits.includes(trait)) return;

  ydoc.transact(() => {
    profilesMap.set(characterId, {
      ...existing,
      discoveredTraits: [...existing.discoveredTraits, trait],
      lastUpdatedAt: new Date().toISOString(),
    });
  });
}

export function deleteProfile(characterId: string): void {
  ydoc.transact(() => {
    profilesMap.delete(characterId);
  });
}

export function onProfilesChange(callback: (profiles: CharacterProfile[]) => void): () => void {
  const handler = () => callback(getAllProfiles());
  profilesMap.observeDeep(handler);
  return () => profilesMap.unobserveDeep(handler);
}

// ============================================
// IFS DIALOG JOURNAL
// ============================================

export function getAllJournalEntries(): JournalEntry[] {
  return Array.from(journalMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getJournalEntry(id: string): JournalEntry | undefined {
  return journalMap.get(id);
}

export function getJournalEntriesForPart(partId: string): JournalEntry[] {
  return getAllJournalEntries().filter(
    entry => entry.dialog.some(line => line.partId === partId)
  );
}

export function addJournalEntry(entry: JournalEntry): void {
  ydoc.transact(() => {
    journalMap.set(entry.id, entry);
  });
}

export function updateJournalEntry(id: string, updates: Partial<JournalEntry>): void {
  const existing = journalMap.get(id);
  if (!existing) return;

  ydoc.transact(() => {
    journalMap.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function addDialogLineToEntry(entryId: string, line: JournalEntry['dialog'][0]): void {
  const existing = journalMap.get(entryId);
  if (!existing) return;

  ydoc.transact(() => {
    journalMap.set(entryId, {
      ...existing,
      dialog: [...existing.dialog, line],
      updatedAt: new Date().toISOString(),
    });
  });
}

export function updateDialogLine(entryId: string, lineId: string, updates: Partial<JournalEntry['dialog'][0]>): void {
  const existing = journalMap.get(entryId);
  if (!existing) return;

  const lineIndex = existing.dialog.findIndex(l => l.id === lineId);
  if (lineIndex < 0) return;

  const updatedDialog = [...existing.dialog];
  updatedDialog[lineIndex] = { ...updatedDialog[lineIndex], ...updates };

  ydoc.transact(() => {
    journalMap.set(entryId, {
      ...existing,
      dialog: updatedDialog,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function removeDialogLine(entryId: string, lineId: string): void {
  const existing = journalMap.get(entryId);
  if (!existing) return;

  ydoc.transact(() => {
    journalMap.set(entryId, {
      ...existing,
      dialog: existing.dialog.filter(l => l.id !== lineId),
      updatedAt: new Date().toISOString(),
    });
  });
}

export function addHeroAdviceToEntry(entryId: string, advice: JournalEntry['heroAdvice'][0]): void {
  const existing = journalMap.get(entryId);
  if (!existing) return;

  ydoc.transact(() => {
    journalMap.set(entryId, {
      ...existing,
      heroAdvice: [...existing.heroAdvice, advice],
      updatedAt: new Date().toISOString(),
    });
  });
}

export function updateHeroAdviceFeedback(entryId: string, adviceId: string, helpful: boolean): void {
  const existing = journalMap.get(entryId);
  if (!existing) return;

  const adviceIndex = existing.heroAdvice.findIndex(a => a.id === adviceId);
  if (adviceIndex < 0) return;

  const updatedAdvice = [...existing.heroAdvice];
  updatedAdvice[adviceIndex] = { ...updatedAdvice[adviceIndex], helpful };

  ydoc.transact(() => {
    journalMap.set(entryId, {
      ...existing,
      heroAdvice: updatedAdvice,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function addInsightToJournalEntry(entryId: string, insightId: string): void {
  const existing = journalMap.get(entryId);
  if (!existing) return;

  if (existing.insightIds.includes(insightId)) return;

  ydoc.transact(() => {
    journalMap.set(entryId, {
      ...existing,
      insightIds: [...existing.insightIds, insightId],
      updatedAt: new Date().toISOString(),
    });
  });
}

export function setJournalResolution(entryId: string, resolution: string): void {
  updateJournalEntry(entryId, { resolution });
}

export function deleteJournalEntry(id: string): void {
  ydoc.transact(() => {
    journalMap.delete(id);
  });
}

export function onJournalChange(callback: (entries: JournalEntry[]) => void): () => void {
  const handler = () => callback(getAllJournalEntries());
  journalMap.observeDeep(handler);
  return () => journalMap.unobserveDeep(handler);
}

// ============================================
// WRITING MODE
// ============================================

export function getAllWritingEntries(): WritingEntry[] {
  return Array.from(writingMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getWritingEntry(id: string): WritingEntry | undefined {
  return writingMap.get(id);
}

export function addWritingEntry(entry: WritingEntry): void {
  ydoc.transact(() => {
    writingMap.set(entry.id, entry);
  });
}

export function updateWritingEntry(id: string, updates: Partial<WritingEntry>): void {
  ydoc.transact(() => {
    const existing = writingMap.get(id);
    if (!existing) return;

    // Recalculate word count if content changed
    if (updates.content !== undefined) {
      updates.wordCount = updates.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    }

    writingMap.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function addCommentaryToWriting(entryId: string, commentary: HeroCommentary): void {
  const existing = writingMap.get(entryId);
  if (!existing) return;

  ydoc.transact(() => {
    writingMap.set(entryId, {
      ...existing,
      commentaries: [...existing.commentaries, commentary],
      updatedAt: new Date().toISOString(),
    });
  });
}

export function updateCommentaryFeedback(entryId: string, commentaryId: string, helpful: boolean): void {
  const existing = writingMap.get(entryId);
  if (!existing) return;

  const commentaryIndex = existing.commentaries.findIndex(c => c.id === commentaryId);
  if (commentaryIndex < 0) return;

  const updatedCommentaries = [...existing.commentaries];
  updatedCommentaries[commentaryIndex] = { ...updatedCommentaries[commentaryIndex], helpful };

  ydoc.transact(() => {
    writingMap.set(entryId, {
      ...existing,
      commentaries: updatedCommentaries,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function deleteWritingEntry(id: string): void {
  ydoc.transact(() => {
    writingMap.delete(id);
  });
}

export function onWritingChange(callback: (entries: WritingEntry[]) => void): () => void {
  const handler = () => callback(getAllWritingEntries());
  writingMap.observeDeep(handler);
  return () => writingMap.unobserveDeep(handler);
}

// Clear all data (for testing/reset)
export function clearAllData(): void {
  ydoc.transact(() => {
    // Core data
    partsMap.clear();
    loansMap.clear();
    while (transactionsArray.length > 0) {
      transactionsArray.delete(0, transactionsArray.length);
    }
    while (creditEventsArray.length > 0) {
      creditEventsArray.delete(0, creditEventsArray.length);
    }
    centralBankMap.clear();

    // Game data
    personalitiesMap.clear();
    conversationsMap.clear();
    relationshipsMap.clear();
    gameStateMap.clear();

    // Battle data
    battlesMap.clear();
    battleCharactersMap.clear();

    // Character evolution & journal data
    insightsMap.clear();
    profilesMap.clear();
    journalMap.clear();

    // Writing mode data
    writingMap.clear();

    initializeCentralBankIfNeeded();
  });
}
