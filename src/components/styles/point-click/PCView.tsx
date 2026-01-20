import { useCallback, useState } from 'react';
import { useGameStateWithParts, useGameStateActions } from '../../../hooks/useGameState';
import { usePartPersonality } from '../../../hooks/usePersonalities';
import { useRelationship } from '../../../hooks/useRelationships';
import { useActiveCommitments } from '../../../hooks/useLoans';
import { useConversation, useConversationActions } from '../../../hooks/useConversations';
import { useGameStore } from '../../../store/gameStore';
import { useLLMWithGameStore } from '../../../hooks/useLLM';
import { DialogueBox } from '../../dialogue';
import { PCScene } from './PCScene';
import { PCHotspot } from './PCHotspot';
import type { PartMood } from '../../../models/types';

// Hotspot positions for characters in the scene
const HOTSPOT_POSITIONS = [
  { x: 15, y: 55, width: 18, height: 35 },
  { x: 40, y: 50, width: 20, height: 40 },
  { x: 70, y: 55, width: 18, height: 35 },
  { x: 85, y: 60, width: 12, height: 30 },
];

export function PCView() {
  const { partsWithState, activeConversationId } = useGameStateWithParts();
  const { openConversation, closeConversation } = useGameStateActions();

  const dialogue = useGameStore((state) => state.dialogue);
  const openDialogue = useGameStore((state) => state.openDialogue);
  const closeDialogue = useGameStore((state) => state.closeDialogue);

  const { sendMessageWithUI, isAvailable } = useLLMWithGameStore();
  const { startConversation, sendUserMessage, sendPartMessage } = useConversationActions();

  // Currently hovered hotspot
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Cursor position for tooltip
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Get current part data for dialogue
  const currentPart = partsWithState.find(p => p.id === dialogue.partId);
  const personality = usePartPersonality(dialogue.partId);
  const relationship = useRelationship(dialogue.partId);
  const activeCommitments = useActiveCommitments().filter(c => c.partId === dialogue.partId);
  const conversation = useConversation(dialogue.conversationId);

  // Track mouse for cursor tooltip
  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  // Handle clicking on a character hotspot
  const handleHotspotClick = useCallback((partId: string) => {
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

  const hoveredPartData = partsWithState.find(p => p.id === hoveredPart);

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
    >
      {/* Scene background */}
      <PCScene />

      {/* Character hotspots */}
      {partsWithState.slice(0, 4).map((part, index) => {
        const pos = HOTSPOT_POSITIONS[index];
        return (
          <PCHotspot
            key={part.id}
            part={part}
            mood={getMood(part.id)}
            gameState={part.gameState}
            x={pos.x}
            y={pos.y}
            width={pos.width}
            height={pos.height}
            isActive={dialogue.partId === part.id}
            isHovered={hoveredPart === part.id}
            onHover={(hovered) => setHoveredPart(hovered ? part.id : null)}
            onClick={() => handleHotspotClick(part.id)}
          />
        );
      })}

      {/* Cursor tooltip when hovering */}
      {hoveredPartData && !dialogue.isOpen && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: cursorPos.x + 15,
            top: cursorPos.y + 15,
          }}
        >
          <div className="bg-[var(--color-pixel-bg)] border-2 border-[var(--color-pixel-accent)] px-3 py-2">
            <div className="text-[11px] text-[var(--color-pixel-accent)] font-bold">
              {hoveredPartData.name}
            </div>
            <div className="text-[9px] text-[var(--color-pixel-text-dim)]">
              Click to talk
            </div>
            <div className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1">
              ${hoveredPartData.balance.toLocaleString()} • {getMood(hoveredPartData.id)}
            </div>
          </div>
        </div>
      )}

      {/* Dialogue overlay */}
      {dialogue.isOpen && currentPart && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center p-4">
          <div className="w-full max-w-2xl">
            <DialogueBox
              part={currentPart}
              mood={getMood(currentPart.id)}
              message={dialogue.streamingText || (conversation?.messages.slice(-1)[0]?.content ?? `*You approach ${currentPart.name}*`)}
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

      {/* Instructions */}
      {!dialogue.isOpen && (
        <div className="absolute bottom-2 left-2 text-[8px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/90 px-2 py-1 border border-[var(--color-pixel-secondary)]">
          Click on characters to interact
        </div>
      )}

      {/* API key warning */}
      {!isAvailable && (
        <div className="absolute top-2 right-2 text-[9px] text-[var(--color-pixel-warning)] bg-[var(--color-pixel-bg)]/90 px-2 py-1 border border-[var(--color-pixel-warning)]">
          Set OpenRouter API key in Settings
        </div>
      )}

      {/* Style indicator */}
      <div className="absolute top-2 left-2 text-[8px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/80 px-2 py-1">
        Point & Click Mode
      </div>
    </div>
  );
}
