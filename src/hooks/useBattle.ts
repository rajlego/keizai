import { useState, useEffect, useCallback } from 'react';
import type {
  Battle,
  BattleCharacter,
  BattleAction,
  BattleActionType,
  BattleStatus,
  VictoryType,
  BattleReward,
} from '../models/types';
import {
  getAllBattles,
  getBattle,
  getActiveBattle,
  addBattle,
  updateBattle,
  addActionToBattle,
  addHeroToBattle,
  updateBattleCharacter,
  deleteBattle,
  getAllBattleCharacters,
  getBattleCharacter,
  onBattlesChange,
  onBattleCharactersChange,
} from '../sync/yjsProvider';

// Generate unique ID
function generateId(prefix: string = 'btl'): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Hook for all battles
export function useBattles() {
  const [battles, setBattles] = useState<Battle[]>(() => getAllBattles());

  useEffect(() => {
    const unsubscribe = onBattlesChange(setBattles);
    return unsubscribe;
  }, []);

  return battles;
}

// Hook for a specific battle
export function useBattle(battleId: string | null) {
  const [battle, setBattle] = useState<Battle | null>(() =>
    battleId ? getBattle(battleId) ?? null : null
  );

  useEffect(() => {
    if (!battleId) {
      setBattle(null);
      return;
    }

    const unsubscribe = onBattlesChange((battles) => {
      const found = battles.find(b => b.id === battleId);
      setBattle(found ?? null);
    });

    return unsubscribe;
  }, [battleId]);

  return battle;
}

// Hook for the currently active battle
export function useActiveBattle() {
  const [battle, setBattle] = useState<Battle | null>(() => getActiveBattle() ?? null);

  useEffect(() => {
    const unsubscribe = onBattlesChange((battles) => {
      const active = battles.find(b =>
        b.status === 'active' || b.status === 'setup' || b.status === 'summoning'
      );
      setBattle(active ?? null);
    });

    return unsubscribe;
  }, []);

  return battle;
}

// Hook for all battle characters
export function useBattleCharacters() {
  const [characters, setCharacters] = useState<BattleCharacter[]>(() => getAllBattleCharacters());

  useEffect(() => {
    const unsubscribe = onBattleCharactersChange(setCharacters);
    return unsubscribe;
  }, []);

  return characters;
}

// Hook for a specific battle character
export function useBattleCharacter(characterId: string | null) {
  const [character, setCharacter] = useState<BattleCharacter | null>(() =>
    characterId ? getBattleCharacter(characterId) ?? null : null
  );

  useEffect(() => {
    if (!characterId) {
      setCharacter(null);
      return;
    }

    const unsubscribe = onBattleCharactersChange((characters) => {
      const found = characters.find(c => c.id === characterId);
      setCharacter(found ?? null);
    });

    return unsubscribe;
  }, [characterId]);

  return character;
}

// Hook for managing battle actions
export function useBattleActions() {
  // Create a new battle
  const createBattle = useCallback((
    scenario: string,
    villain: Omit<BattleCharacter, 'id' | 'createdAt'>,
    partIds: string[]
  ): string => {
    const now = new Date().toISOString();
    const villainId = generateId('vln');

    const fullVillain: BattleCharacter = {
      ...villain,
      id: villainId,
      createdAt: now,
    };

    const battle: Battle = {
      id: generateId('btl'),
      scenario,
      villain: fullVillain,
      heroes: [],
      partIds,
      status: 'setup',
      currentRound: 0,
      currentActorId: '',
      turnOrder: [villainId],
      actions: [],
      conversationId: generateId('conv'),
      createdAt: now,
    };

    addBattle(battle);
    return battle.id;
  }, []);

  // Update battle status
  const setBattleStatus = useCallback((battleId: string, status: BattleStatus) => {
    updateBattle(battleId, { status });
  }, []);

  // Start the battle (transition from summoning to active)
  const startBattle = useCallback((battleId: string) => {
    const battle = getBattle(battleId);
    if (!battle) return;

    // Set initial turn order: heroes and parts first, villain last
    const turnOrder = [
      ...battle.heroes.map(h => h.id),
      ...battle.partIds,
      battle.villain.id,
    ];

    updateBattle(battleId, {
      status: 'active',
      currentRound: 1,
      currentActorId: turnOrder[0] ?? battle.villain.id,
      turnOrder,
    });
  }, []);

  // Add a hero to the battle
  const summonHero = useCallback((
    battleId: string,
    hero: Omit<BattleCharacter, 'id' | 'createdAt'>
  ): string => {
    const now = new Date().toISOString();
    const heroId = generateId('hero');

    const fullHero: BattleCharacter = {
      ...hero,
      id: heroId,
      createdAt: now,
    };

    addHeroToBattle(battleId, fullHero);
    return heroId;
  }, []);

  // Execute a battle action
  const executeAction = useCallback((
    battleId: string,
    characterId: string,
    actionType: BattleActionType,
    targetId: string | undefined,
    dialogue: string,
    narration: string,
    effects: {
      damage?: number;
      healing?: number;
      trustDelta?: number;
      understandingDelta?: number;
    } = {}
  ): BattleAction => {
    const battle = getBattle(battleId);
    if (!battle) throw new Error('Battle not found');

    const action: BattleAction = {
      id: generateId('act'),
      round: battle.currentRound,
      characterId,
      targetId,
      actionType,
      dialogue,
      narration,
      ...effects,
      timestamp: new Date().toISOString(),
    };

    addActionToBattle(battleId, action);

    // Apply effects to target
    if (targetId && (effects.damage || effects.healing || effects.trustDelta || effects.understandingDelta)) {
      const target = getBattleCharacter(targetId);
      if (target) {
        const updates: Partial<BattleCharacter> = {};

        if (effects.damage) {
          updates.health = Math.max(0, target.health - effects.damage);
        }
        if (effects.healing) {
          updates.health = Math.min(target.maxHealth, target.health + effects.healing);
        }
        if (effects.trustDelta) {
          updates.trust = Math.min(100, Math.max(0, target.trust + effects.trustDelta));
        }
        if (effects.understandingDelta) {
          updates.understanding = Math.min(100, Math.max(0, target.understanding + effects.understandingDelta));
        }

        updateBattleCharacter(targetId, updates);
      }
    }

    return action;
  }, []);

  // Advance to next turn
  const nextTurn = useCallback((battleId: string) => {
    const battle = getBattle(battleId);
    if (!battle) return;

    const currentIndex = battle.turnOrder.indexOf(battle.currentActorId);
    const nextIndex = (currentIndex + 1) % battle.turnOrder.length;
    const isNewRound = nextIndex === 0;

    updateBattle(battleId, {
      currentActorId: battle.turnOrder[nextIndex],
      currentRound: isNewRound ? battle.currentRound + 1 : battle.currentRound,
    });
  }, []);

  // Check victory conditions
  const checkVictory = useCallback((battleId: string): VictoryType | null => {
    const battle = getBattle(battleId);
    if (!battle) return null;

    const villain = battle.villain;

    // HP Depletion - villain health reaches 0
    if (villain.health <= 0) {
      return 'hp_depletion';
    }

    // Integration - understanding reaches 100
    if (villain.understanding >= 100) {
      return 'integration';
    }

    // Negotiation - trust reaches 100
    if (villain.trust >= 100) {
      return 'negotiation';
    }

    // Defeat - all heroes have 0 health (simplified check)
    const aliveHeroes = battle.heroes.filter(h => h.health > 0);
    if (aliveHeroes.length === 0 && battle.heroes.length > 0) {
      return 'defeat';
    }

    return null;
  }, []);

  // End the battle
  const endBattle = useCallback((
    battleId: string,
    victoryType: VictoryType,
    rewards: BattleReward[] = []
  ) => {
    updateBattle(battleId, {
      status: 'completed',
      victoryType,
      rewards,
      completedAt: new Date().toISOString(),
    });
  }, []);

  // Flee from battle
  const fleeBattle = useCallback((battleId: string) => {
    endBattle(battleId, 'flee', []);
  }, [endBattle]);

  // Delete a battle
  const removeBattle = useCallback((battleId: string) => {
    deleteBattle(battleId);
  }, []);

  // Update a character's stats
  const updateCharacter = useCallback((
    characterId: string,
    updates: Partial<BattleCharacter>
  ) => {
    updateBattleCharacter(characterId, updates);
  }, []);

  return {
    createBattle,
    setBattleStatus,
    startBattle,
    summonHero,
    executeAction,
    nextTurn,
    checkVictory,
    endBattle,
    fleeBattle,
    removeBattle,
    updateCharacter,
  };
}

// Combined hook for battle state and actions
export function useBattleManager(battleId: string | null) {
  const battle = useBattle(battleId);
  const actions = useBattleActions();

  return {
    battle,
    ...actions,
  };
}
