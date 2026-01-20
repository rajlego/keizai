import { useCallback } from 'react';
import { useGameStateWithParts, useGameStateActions } from '../../../hooks/useGameState';
import { usePartPersonality } from '../../../hooks/usePersonalities';
import { useRelationship } from '../../../hooks/useRelationships';
import { useActiveCommitments } from '../../../hooks/useLoans';
import { useConversation, useConversationActions } from '../../../hooks/useConversations';
import { useGameStore } from '../../../store/gameStore';
import { useLLMWithGameStore } from '../../../hooks/useLLM';
import { HubRoom } from './HubRoom';
import { HubCharacter } from './HubCharacter';
import { DialogueBox } from '../../dialogue';

export function HubView() {
  const { partsWithState, activeConversationId } = useGameStateWithParts();
  const { openConversation, closeConversation } = useGameStateActions();

  const dialogue = useGameStore((state) => state.dialogue);
  const openDialogue = useGameStore((state) => state.openDialogue);
  const closeDialogue = useGameStore((state) => state.closeDialogue);

  const { sendMessageWithUI, isAvailable } = useLLMWithGameStore();
  const { startConversation, sendUserMessage, sendPartMessage } = useConversationActions();

  // Get current part data for dialogue
  const currentPart = partsWithState.find(p => p.id === dialogue.partId);
  const personality = usePartPersonality(dialogue.partId);
  const relationship = useRelationship(dialogue.partId);
  const activeCommitments = useActiveCommitments().filter(c => c.partId === dialogue.partId);
  const conversation = useConversation(dialogue.conversationId);

  // Handle clicking on a character
  const handleCharacterClick = useCallback((partId: string) => {
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

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Hub Room Background */}
      <HubRoom>
        {/* Characters */}
        {partsWithState.map((part) => (
          <HubCharacter
            key={part.id}
            part={part}
            gameState={part.gameState}
            onClick={() => handleCharacterClick(part.id)}
            isActive={dialogue.partId === part.id}
          />
        ))}
      </HubRoom>

      {/* Dialogue Overlay */}
      {dialogue.isOpen && currentPart && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center p-4">
          <div className="w-full max-w-2xl">
            <DialogueBox
              part={currentPart}
              mood={partsWithState.find(p => p.id === currentPart.id)?.gameState.mood ?? 'neutral'}
              message={dialogue.streamingText || (conversation?.messages.slice(-1)[0]?.content ?? `*${currentPart.name} looks at you expectantly*`)}
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
        <div className="absolute bottom-2 left-2 text-[8px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/80 px-2 py-1">
          Click a character to talk
        </div>
      )}

      {/* LLM not available warning */}
      {!isAvailable && (
        <div className="absolute top-2 right-2 text-[9px] text-[var(--color-pixel-warning)] bg-[var(--color-pixel-bg)]/80 px-2 py-1 border border-[var(--color-pixel-warning)]">
          ⚠️ Set OpenRouter API key in Settings
        </div>
      )}
    </div>
  );
}
