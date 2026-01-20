import { useCallback, useState } from 'react';
import { useGameStateWithParts, useGameStateActions } from '../../../hooks/useGameState';
import { usePartPersonality } from '../../../hooks/usePersonalities';
import { useRelationship } from '../../../hooks/useRelationships';
import { useActiveCommitments } from '../../../hooks/useLoans';
import { useConversation, useConversationActions } from '../../../hooks/useConversations';
import { useGameStore } from '../../../store/gameStore';
import { useLLMWithGameStore } from '../../../hooks/useLLM';
import { DialogueBox } from '../../dialogue';
import { VNCharacterSprite } from './VNCharacterSprite';
import { VNBackground } from './VNBackground';
import type { Part, PartMood } from '../../../models/types';

export function VNView() {
  const { partsWithState, activeConversationId } = useGameStateWithParts();
  const { openConversation, closeConversation } = useGameStateActions();

  const dialogue = useGameStore((state) => state.dialogue);
  const openDialogue = useGameStore((state) => state.openDialogue);
  const closeDialogue = useGameStore((state) => state.closeDialogue);

  const { sendMessageWithUI, isAvailable } = useLLMWithGameStore();
  const { startConversation, sendUserMessage, sendPartMessage } = useConversationActions();

  // Track which character is in focus (center position)
  const [focusedPartId, setFocusedPartId] = useState<string | null>(null);

  // Get current part data for dialogue
  const currentPart = partsWithState.find(p => p.id === dialogue.partId);
  const personality = usePartPersonality(dialogue.partId);
  const relationship = useRelationship(dialogue.partId);
  const activeCommitments = useActiveCommitments().filter(c => c.partId === dialogue.partId);
  const conversation = useConversation(dialogue.conversationId);

  // Handle clicking on a character
  const handleCharacterClick = useCallback((partId: string) => {
    setFocusedPartId(partId);

    // Start or continue conversation
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
    setFocusedPartId(null);
  }, [closeDialogue, closeConversation]);

  // Handle user response
  const handleResponse = useCallback(async (response: string) => {
    if (!currentPart || !dialogue.conversationId) return;

    // Add user message to conversation
    sendUserMessage(dialogue.conversationId, response);

    // Get LLM response
    try {
      const partResponse = await sendMessageWithUI(
        currentPart,
        personality,
        relationship,
        activeCommitments,
        conversation?.messages ?? [],
        response
      );

      // Add part's response to conversation
      sendPartMessage(dialogue.conversationId, currentPart.id, partResponse);
    } catch (error) {
      console.error('Failed to get response:', error);
    }
  }, [currentPart, dialogue.conversationId, personality, relationship, activeCommitments, conversation, sendMessageWithUI, sendUserMessage, sendPartMessage]);

  // Arrange characters for VN display (max 3 visible at once)
  const visibleParts = partsWithState.slice(0, 3);

  // Determine character positions based on focus
  const getCharacterPosition = (part: Part, index: number): 'left' | 'center' | 'right' => {
    if (focusedPartId === part.id) return 'center';
    if (visibleParts.length === 1) return 'center';
    if (visibleParts.length === 2) return index === 0 ? 'left' : 'right';
    // 3 characters
    if (focusedPartId) {
      const focusedIndex = visibleParts.findIndex(p => p.id === focusedPartId);
      if (focusedIndex === index) return 'center';
      if (index < focusedIndex) return 'left';
      return 'right';
    }
    return index === 0 ? 'left' : index === 1 ? 'center' : 'right';
  };

  const getMood = (partId: string): PartMood => {
    return partsWithState.find(p => p.id === partId)?.gameState.mood ?? 'neutral';
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background */}
      <VNBackground scene="default" />

      {/* Character Layer */}
      <div className="absolute inset-0 flex items-end justify-center pb-48">
        {visibleParts.map((part, index) => (
          <VNCharacterSprite
            key={part.id}
            part={part}
            mood={getMood(part.id)}
            position={getCharacterPosition(part, index)}
            isActive={dialogue.partId === part.id}
            isSpeaking={dialogue.isOpen && dialogue.partId === part.id}
            onClick={() => handleCharacterClick(part.id)}
          />
        ))}
      </div>

      {/* Dialogue Box (VN style - bottom of screen) */}
      {dialogue.isOpen && currentPart && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="max-w-4xl mx-auto">
            <DialogueBox
              part={currentPart}
              mood={getMood(currentPart.id)}
              message={dialogue.streamingText || (conversation?.messages.slice(-1)[0]?.content ?? `*${currentPart.name} awaits your words*`)}
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

      {/* Character select hint (when no dialogue) */}
      {!dialogue.isOpen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/90 px-4 py-2 border-2 border-[var(--color-pixel-secondary)]">
          Click a character to begin conversation
        </div>
      )}

      {/* API key warning */}
      {!isAvailable && (
        <div className="absolute top-4 right-4 text-[9px] text-[var(--color-pixel-warning)] bg-[var(--color-pixel-bg)]/90 px-3 py-2 border border-[var(--color-pixel-warning)]">
          Set OpenRouter API key in Settings
        </div>
      )}

      {/* Style indicator */}
      <div className="absolute top-2 left-2 text-[8px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/80 px-2 py-1">
        Visual Novel Mode
      </div>
    </div>
  );
}
