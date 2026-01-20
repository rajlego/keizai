import { useCallback, useState, useEffect } from 'react';
import { useGameStateWithParts, useGameStateActions } from '../../../hooks/useGameState';
import { usePartPersonality } from '../../../hooks/usePersonalities';
import { useRelationship } from '../../../hooks/useRelationships';
import { useActiveCommitments } from '../../../hooks/useLoans';
import { useConversation, useConversationActions } from '../../../hooks/useConversations';
import { useGameStore } from '../../../store/gameStore';
import { useLLMWithGameStore } from '../../../hooks/useLLM';
import { DialogueBox } from '../../dialogue';
import { RPGMap } from './RPGMap';
import { RPGSprite } from './RPGSprite';
import type { PartMood } from '../../../models/types';

// Grid-based player position
interface Position {
  x: number;
  y: number;
}

export function RPGView() {
  const { partsWithState, activeConversationId } = useGameStateWithParts();
  const { openConversation, closeConversation } = useGameStateActions();

  const dialogue = useGameStore((state) => state.dialogue);
  const openDialogue = useGameStore((state) => state.openDialogue);
  const closeDialogue = useGameStore((state) => state.closeDialogue);

  const { sendMessageWithUI, isAvailable } = useLLMWithGameStore();
  const { startConversation, sendUserMessage, sendPartMessage } = useConversationActions();

  // Player position on grid (0-9 x 0-6)
  const [playerPos, setPlayerPos] = useState<Position>({ x: 4, y: 3 });

  // Get current part data for dialogue
  const currentPart = partsWithState.find(p => p.id === dialogue.partId);
  const personality = usePartPersonality(dialogue.partId);
  const relationship = useRelationship(dialogue.partId);
  const activeCommitments = useActiveCommitments().filter(c => c.partId === dialogue.partId);
  const conversation = useConversation(dialogue.conversationId);

  // Character positions on grid (spread them out)
  const characterPositions: Record<string, Position> = {};
  partsWithState.slice(0, 6).forEach((part, i) => {
    const positions = [
      { x: 2, y: 1 }, { x: 7, y: 1 },
      { x: 1, y: 4 }, { x: 8, y: 4 },
      { x: 3, y: 5 }, { x: 6, y: 5 },
    ];
    characterPositions[part.id] = positions[i] || { x: 5, y: 3 };
  });

  // Handle keyboard movement
  useEffect(() => {
    if (dialogue.isOpen) return; // Don't move during dialogue

    const handleKeyDown = (e: KeyboardEvent) => {
      const moves: Record<string, Position> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const move = moves[e.key];
      if (move) {
        e.preventDefault();
        setPlayerPos(prev => ({
          x: Math.max(0, Math.min(9, prev.x + move.x)),
          y: Math.max(0, Math.min(6, prev.y + move.y)),
        }));
      }

      // Space/Enter to interact
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        // Check if adjacent to any character
        for (const part of partsWithState) {
          const pos = characterPositions[part.id];
          if (pos) {
            const dx = Math.abs(pos.x - playerPos.x);
            const dy = Math.abs(pos.y - playerPos.y);
            if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
              handleCharacterInteract(part.id);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, dialogue.isOpen, partsWithState]);

  // Handle character interaction
  const handleCharacterInteract = useCallback((partId: string) => {
    let convId = activeConversationId;

    if (!convId) {
      convId = startConversation([partId], 'casual');
      openConversation(convId);
    }

    openDialogue(partId, convId);
  }, [activeConversationId, startConversation, openConversation, openDialogue]);

  // Handle dialogue close
  const handleDialogueClose = useCallback(() => {
    closeDialogue();
    closeConversation();
  }, [closeDialogue, closeConversation]);

  // Handle user response
  const handleResponse = useCallback(async (response: string) => {
    if (!currentPart || !dialogue.conversationId) return;

    sendUserMessage(dialogue.conversationId, response);

    try {
      const partResponse = await sendMessageWithUI(
        currentPart,
        personality,
        relationship,
        activeCommitments,
        conversation?.messages ?? [],
        response
      );

      sendPartMessage(dialogue.conversationId, currentPart.id, partResponse);
    } catch (error) {
      console.error('Failed to get response:', error);
    }
  }, [currentPart, dialogue.conversationId, personality, relationship, activeCommitments, conversation, sendMessageWithUI, sendUserMessage, sendPartMessage]);

  const getMood = (partId: string): PartMood => {
    return partsWithState.find(p => p.id === partId)?.gameState.mood ?? 'neutral';
  };

  // Check if player is adjacent to a character
  const getAdjacentPart = () => {
    for (const part of partsWithState) {
      const pos = characterPositions[part.id];
      if (pos) {
        const dx = Math.abs(pos.x - playerPos.x);
        const dy = Math.abs(pos.y - playerPos.y);
        if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
          return part;
        }
      }
    }
    return null;
  };

  const adjacentPart = getAdjacentPart();

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a3d1a]">
      {/* Map background */}
      <RPGMap />

      {/* Game layer */}
      <div className="absolute inset-0">
        {/* Characters */}
        {partsWithState.slice(0, 6).map((part) => {
          const pos = characterPositions[part.id];
          return (
            <RPGSprite
              key={part.id}
              part={part}
              mood={getMood(part.id)}
              gameState={part.gameState}
              gridX={pos?.x ?? 5}
              gridY={pos?.y ?? 3}
              isActive={dialogue.partId === part.id}
              onClick={() => handleCharacterInteract(part.id)}
            />
          );
        })}

        {/* Player sprite */}
        <div
          className="absolute w-8 h-8 transition-all duration-150 ease-out z-20"
          style={{
            left: `${playerPos.x * 10 + 5}%`,
            top: `${playerPos.y * 14.28 + 7}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-full h-full border-2 border-black bg-[var(--color-pixel-warning)] flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">YOU</span>
          </div>
          {/* Player shadow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-black/30 rounded-full" />
        </div>
      </div>

      {/* Interaction prompt */}
      {adjacentPart && !dialogue.isOpen && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/80 px-4 py-2 border-2 border-[var(--color-pixel-accent)]">
          Press [Space] or [Enter] to talk to {adjacentPart.name}
        </div>
      )}

      {/* Dialogue overlay */}
      {dialogue.isOpen && currentPart && (
        <div className="absolute inset-0 bg-black/60 flex items-end justify-center p-4">
          <div className="w-full max-w-2xl">
            <DialogueBox
              part={currentPart}
              mood={getMood(currentPart.id)}
              message={dialogue.streamingText || (conversation?.messages.slice(-1)[0]?.content ?? `*${currentPart.name} turns to face you*`)}
              isStreaming={dialogue.isStreaming}
              choices={dialogue.pendingChoices}
              isGeneratingChoices={dialogue.isGeneratingChoices}
              onChoiceSelect={handleResponse}
              onCustomResponse={handleResponse}
              onClose={handleDialogueClose}
              showHistory={true}
              history={conversation?.messages ?? []}
            />
          </div>
        </div>
      )}

      {/* Controls hint */}
      {!dialogue.isOpen && (
        <div className="absolute bottom-2 left-2 text-[8px] text-white bg-black/80 px-2 py-1">
          [WASD] or [Arrows] to move
        </div>
      )}

      {/* API key warning */}
      {!isAvailable && (
        <div className="absolute top-2 right-2 text-[9px] text-[var(--color-pixel-warning)] bg-black/80 px-2 py-1 border border-[var(--color-pixel-warning)]">
          Set OpenRouter API key in Settings
        </div>
      )}

      {/* Style indicator */}
      <div className="absolute top-2 left-2 text-[8px] text-white bg-black/80 px-2 py-1">
        Top-Down RPG Mode
      </div>
    </div>
  );
}
