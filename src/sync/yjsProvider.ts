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
  const existing = personalitiesMap.get(partId);
  if (!existing) return;

  ydoc.transact(() => {
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
  const existing = conversationsMap.get(id);
  if (!existing) return;

  ydoc.transact(() => {
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

    initializeCentralBankIfNeeded();
  });
}
