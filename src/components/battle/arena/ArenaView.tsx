import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Battle, BattleCharacter, BattleActionType } from '../../../models/types';
import { CharacterDisplay } from './CharacterDisplay';
import { ActionPanel } from './ActionPanel';
import { BattleDialogue } from './BattleDialogue';
import { VictoryScreen } from './VictoryScreen';
import {
  generateVillainResponse,
  checkVictoryCondition,
  calculateRewards,
  generateVictoryNarrative,
} from '../../../services/battle';
import { useBattleActions } from '../../../hooks/useBattle';
import { useParts } from '../../../hooks/useParts';

interface ArenaViewProps {
  battle: Battle;
  apiKey: string;
  onBattleEnd: () => void;
  onFlee: () => void;
}

export function ArenaView({
  battle,
  apiKey,
  onBattleEnd,
  onFlee,
}: ArenaViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [victoryNarrative, setVictoryNarrative] = useState<string>();
  const [currentDialogue, setCurrentDialogue] = useState<{
    characterId: string;
    text: string;
    isStreaming: boolean;
  }>();

  const parts = useParts();
  const { executeAction, nextTurn, endBattle, updateCharacter } = useBattleActions();

  // Build character map for quick lookup
  const characterMap = useMemo(() => {
    const map = new Map<string, BattleCharacter>();
    map.set(battle.villain.id, battle.villain);
    battle.heroes.forEach(h => map.set(h.id, h));
    return map;
  }, [battle.villain, battle.heroes]);

  // Get current actor
  const currentActor = useMemo(() => {
    return characterMap.get(battle.currentActorId);
  }, [characterMap, battle.currentActorId]);

  // Check if it's the player's turn (hero or part)
  const isPlayerTurn = currentActor?.role !== 'villain';

  // Handle player action selection
  const handleActionSelect = useCallback(async (actionType: BattleActionType, targetId: string) => {
    if (isProcessing || !currentActor) return;

    setIsProcessing(true);

    try {
      // Generate dialogue for the action
      const dialogueMap: Record<BattleActionType, string> = {
        attack: `I will confront you directly, ${battle.villain.name}!`,
        understand: `Tell me... what do you truly need?`,
        negotiate: `Perhaps we can find common ground.`,
        support: `I'm here to help!`,
        defend: `I stand ready to protect.`,
        special: `Feel the power of my special ability!`,
      };

      const narrationMap: Record<BattleActionType, string> = {
        attack: `${currentActor.name} strikes with determination.`,
        understand: `${currentActor.name} reaches out with empathy.`,
        negotiate: `${currentActor.name} extends an offer of peace.`,
        support: `${currentActor.name} bolsters their ally.`,
        defend: `${currentActor.name} takes a defensive stance.`,
        special: `${currentActor.name} unleashes their unique power!`,
      };

      // Execute player action
      const action = executeAction(
        battle.id,
        currentActor.id,
        actionType,
        targetId,
        dialogueMap[actionType],
        narrationMap[actionType]
      );

      // Check victory
      const victory = checkVictoryCondition({
        ...battle,
        villain: {
          ...battle.villain,
          health: actionType === 'attack'
            ? Math.max(0, battle.villain.health - (action.damage ?? 0))
            : battle.villain.health,
          understanding: battle.villain.understanding + (action.understandingDelta ?? 0),
          trust: battle.villain.trust + (action.trustDelta ?? 0),
        },
      });

      if (victory) {
        // Battle won!
        const rewards = calculateRewards(battle, victory, parts);
        endBattle(battle.id, victory, rewards);

        // Generate narrative
        const narrative = await generateVictoryNarrative(battle, victory, apiKey);
        setVictoryNarrative(narrative);
        setShowVictory(true);
        return;
      }

      // Move to next turn (villain's response)
      nextTurn(battle.id);

      // Generate villain response
      const villainResponse = await generateVillainResponse(battle, action, apiKey);

      // Show villain dialogue
      setCurrentDialogue({
        characterId: battle.villain.id,
        text: villainResponse.dialogue,
        isStreaming: false,
      });

      // Execute villain action
      executeAction(
        battle.id,
        battle.villain.id,
        villainResponse.actionType,
        villainResponse.targetId,
        villainResponse.dialogue,
        villainResponse.narration,
        {
          damage: villainResponse.damage,
          healing: villainResponse.healing,
        }
      );

      // Apply damage to hero if attacked
      if (villainResponse.damage && villainResponse.targetId) {
        const target = characterMap.get(villainResponse.targetId);
        if (target) {
          updateCharacter(villainResponse.targetId, {
            health: Math.max(0, target.health - villainResponse.damage),
          });
        }
      }

      // Clear streaming dialogue
      setTimeout(() => {
        setCurrentDialogue(undefined);
      }, 2000);

      // Move to next turn (back to player)
      nextTurn(battle.id);

    } catch (error) {
      console.error('[Battle] Action error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing, currentActor, battle, apiKey, parts,
    executeAction, nextTurn, endBattle, updateCharacter, characterMap
  ]);

  // Check for victory on mount and updates
  useEffect(() => {
    if (battle.status === 'completed' && !showVictory) {
      setShowVictory(true);
    }
  }, [battle.status, showVictory]);

  const handleVictoryClose = () => {
    setShowVictory(false);
    onBattleEnd();
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-pixel-bg)]">
      {/* Battle Header */}
      <div className="p-2 bg-[var(--color-pixel-surface)] border-b-2 border-[var(--color-pixel-secondary)] flex justify-between items-center">
        <div className="text-[10px] text-[var(--color-pixel-text-dim)]">
          Round <span className="text-[var(--color-pixel-accent)]">{battle.currentRound}</span>
        </div>
        <div className="text-[12px] text-[var(--color-pixel-text)] font-bold">
          Boss Battle
        </div>
        <button
          onClick={onFlee}
          disabled={isProcessing}
          className="px-2 py-1 text-[9px] text-[var(--color-pixel-error)] border border-[var(--color-pixel-error)] hover:bg-[var(--color-pixel-error)] hover:text-white disabled:opacity-50"
        >
          Flee
        </button>
      </div>

      {/* Main Arena */}
      <div className="flex-1 p-4 grid grid-cols-3 gap-4">
        {/* Left side - Heroes */}
        <div className="space-y-2">
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] mb-2">Your Team</div>
          {battle.heroes.map(hero => (
            <CharacterDisplay
              key={hero.id}
              character={hero}
              isActive={hero.id === battle.currentActorId}
              side="left"
              compact
            />
          ))}
        </div>

        {/* Center - Villain */}
        <div className="flex items-center justify-center">
          <CharacterDisplay
            character={battle.villain}
            isActive={battle.villain.id === battle.currentActorId}
            side="right"
          />
        </div>

        {/* Right side - Battle info */}
        <div>
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] mb-2">Victory Conditions</div>
          <div className="space-y-2 text-[9px]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-pixel-error)]">HP</span>
              <div className="flex-1 mx-2 h-1.5 bg-[var(--color-pixel-surface)] border border-[#888]">
                <div
                  className="h-full bg-[var(--color-pixel-error)] transition-all"
                  style={{ width: `${(battle.villain.health / battle.villain.maxHealth) * 100}%` }}
                />
              </div>
              <span className="text-[var(--color-pixel-text-dim)]">{battle.villain.health}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-pixel-primary)]">Understand</span>
              <div className="flex-1 mx-2 h-1.5 bg-[var(--color-pixel-surface)] border border-[#888]">
                <div
                  className="h-full bg-[var(--color-pixel-primary)] transition-all"
                  style={{ width: `${battle.villain.understanding}%` }}
                />
              </div>
              <span className="text-[var(--color-pixel-text-dim)]">{battle.villain.understanding}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-pixel-success)]">Trust</span>
              <div className="flex-1 mx-2 h-1.5 bg-[var(--color-pixel-surface)] border border-[#888]">
                <div
                  className="h-full bg-[var(--color-pixel-success)] transition-all"
                  style={{ width: `${battle.villain.trust}%` }}
                />
              </div>
              <span className="text-[var(--color-pixel-text-dim)]">{battle.villain.trust}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue Log */}
      <div className="px-4">
        <BattleDialogue
          actions={battle.actions}
          characters={characterMap}
          currentDialogue={currentDialogue}
          maxHeight="150px"
        />
      </div>

      {/* Action Panel */}
      {isPlayerTurn && currentActor && (
        <div className="p-4">
          <ActionPanel
            character={currentActor}
            villain={battle.villain}
            allies={battle.heroes.filter(h => h.id !== currentActor.id)}
            onSelectAction={handleActionSelect}
            disabled={isProcessing}
          />
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-accent)] px-6 py-4">
            <div className="text-[11px] text-[var(--color-pixel-text)] animate-pulse">
              Processing...
            </div>
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {showVictory && (
        <VictoryScreen
          battle={battle}
          narrative={victoryNarrative}
          onClose={handleVictoryClose}
        />
      )}
    </div>
  );
}
