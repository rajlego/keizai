import { useState, useCallback } from 'react';
import type { Part, PartMood, ConversationMessage } from '../../models/types';
import { CharacterPortrait } from './CharacterPortrait';
import { TypewriterText } from './TypewriterText';

interface DebateParticipant {
  part: Part;
  mood: PartMood;
  stance?: string;
}

interface DebateViewProps {
  participant1: DebateParticipant;
  participant2: DebateParticipant;
  topic: string;
  messages: ConversationMessage[];
  currentSpeaker?: string; // partId of current speaker
  isStreaming?: boolean;
  streamingText?: string;
  onStartDebate: () => void;
  onContinue: () => void;
  onIntervene: (message: string) => void;
  onEnd: () => void;
  isLoading?: boolean;
  isComplete?: boolean;
}

export function DebateView({
  participant1,
  participant2,
  topic,
  messages,
  currentSpeaker,
  isStreaming = false,
  streamingText = '',
  onStartDebate,
  onContinue,
  onIntervene,
  onEnd,
  isLoading = false,
  isComplete = false,
}: DebateViewProps) {
  const [interventionText, setInterventionText] = useState('');
  const [showIntervention, setShowIntervention] = useState(false);

  const getSpeakerPart = (partId?: string) => {
    if (partId === participant1.part.id) return participant1;
    if (partId === participant2.part.id) return participant2;
    return null;
  };

  const currentSpeakerData = getSpeakerPart(currentSpeaker);

  const handleIntervene = useCallback(() => {
    if (interventionText.trim()) {
      onIntervene(interventionText.trim());
      setInterventionText('');
      setShowIntervention(false);
    }
  }, [interventionText, onIntervene]);

  // Get last few messages for display
  const recentMessages = messages.slice(-6);

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)]">
      {/* Header */}
      <div className="p-3 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-bg)]">
        <div className="text-center">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">DEBATE</div>
          <div className="text-[12px] text-[var(--color-pixel-accent)] font-bold">
            {topic}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="flex justify-between items-start p-3">
        {/* Participant 1 */}
        <div
          className={`
            text-center transition-all duration-200
            ${currentSpeaker === participant1.part.id ? 'scale-105' : 'opacity-70'}
          `}
        >
          <div className={`${currentSpeaker === participant1.part.id ? 'ring-2 ring-[var(--color-pixel-accent)]' : ''}`}>
            <CharacterPortrait
              part={participant1.part}
              mood={participant1.mood}
              size="md"
              showName={true}
            />
          </div>
          {participant1.stance && (
            <div className="mt-1 text-[8px] text-[var(--color-pixel-text-dim)] max-w-20">
              "{participant1.stance}"
            </div>
          )}
          {currentSpeaker === participant1.part.id && (
            <div className="mt-1 text-[8px] text-[var(--color-pixel-accent)] animate-pulse">
              Speaking...
            </div>
          )}
        </div>

        {/* VS indicator */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="text-[16px] text-[var(--color-pixel-warning)] font-bold">VS</div>
          <div className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1">
            {messages.length} exchanges
          </div>
        </div>

        {/* Participant 2 */}
        <div
          className={`
            text-center transition-all duration-200
            ${currentSpeaker === participant2.part.id ? 'scale-105' : 'opacity-70'}
          `}
        >
          <div className={`${currentSpeaker === participant2.part.id ? 'ring-2 ring-[var(--color-pixel-accent)]' : ''}`}>
            <CharacterPortrait
              part={participant2.part}
              mood={participant2.mood}
              size="md"
              showName={true}
            />
          </div>
          {participant2.stance && (
            <div className="mt-1 text-[8px] text-[var(--color-pixel-text-dim)] max-w-20">
              "{participant2.stance}"
            </div>
          )}
          {currentSpeaker === participant2.part.id && (
            <div className="mt-1 text-[8px] text-[var(--color-pixel-accent)] animate-pulse">
              Speaking...
            </div>
          )}
        </div>
      </div>

      {/* Debate log */}
      <div className="h-48 overflow-y-auto p-3 bg-[var(--color-pixel-bg)] border-y-2 border-[var(--color-pixel-secondary)]">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-[10px] text-[var(--color-pixel-text-dim)] py-8">
            Click "Start Debate" to begin
          </div>
        )}

        {recentMessages.map((msg, i) => {
          const speaker = getSpeakerPart(msg.partId);
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id || i}
              className={`mb-3 ${msg.partId === participant2.part.id ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`
                  inline-block max-w-[80%] p-2 text-[10px]
                  ${isUser
                    ? 'bg-[var(--color-pixel-surface)] border border-[var(--color-pixel-accent)]'
                    : msg.partId === participant1.part.id
                      ? 'bg-[var(--color-pixel-primary)]/20 border border-[var(--color-pixel-primary)]'
                      : 'bg-[var(--color-pixel-secondary)]/20 border border-[var(--color-pixel-secondary)]'
                  }
                `}
              >
                <div className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">
                  {isUser ? 'You (intervening)' : speaker?.part.name}
                </div>
                <div className="text-[var(--color-pixel-text)]">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Streaming message */}
        {isStreaming && streamingText && currentSpeakerData && (
          <div
            className={`mb-3 ${currentSpeaker === participant2.part.id ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`
                inline-block max-w-[80%] p-2 text-[10px]
                ${currentSpeaker === participant1.part.id
                  ? 'bg-[var(--color-pixel-primary)]/20 border border-[var(--color-pixel-primary)]'
                  : 'bg-[var(--color-pixel-secondary)]/20 border border-[var(--color-pixel-secondary)]'
                }
              `}
            >
              <div className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">
                {currentSpeakerData.part.name}
              </div>
              <TypewriterText
                text={streamingText}
                speed={20}
                className="text-[var(--color-pixel-text)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Intervention input */}
      {showIntervention && (
        <div className="p-3 border-b-2 border-[var(--color-pixel-secondary)]">
          <div className="text-[9px] text-[var(--color-pixel-text-dim)] mb-2">
            Intervene in the debate:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={interventionText}
              onChange={(e) => setInterventionText(e.target.value)}
              placeholder="Share your perspective..."
              className="flex-1 px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px]"
              onKeyDown={(e) => e.key === 'Enter' && handleIntervene()}
            />
            <button
              onClick={handleIntervene}
              disabled={!interventionText.trim()}
              className="px-3 py-1 text-[9px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] disabled:opacity-50"
            >
              Send
            </button>
            <button
              onClick={() => setShowIntervention(false)}
              className="px-2 py-1 text-[9px] text-[var(--color-pixel-text-dim)] border-2 border-[#888]"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 flex gap-2 flex-wrap justify-center">
        {messages.length === 0 && !isLoading && (
          <button
            onClick={onStartDebate}
            className="px-4 py-2 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] hover:brightness-110"
          >
            Start Debate
          </button>
        )}

        {messages.length > 0 && !isComplete && !isLoading && (
          <>
            <button
              onClick={onContinue}
              className="px-3 py-1.5 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] hover:brightness-110"
            >
              Continue
            </button>
            <button
              onClick={() => setShowIntervention(!showIntervention)}
              className="px-3 py-1.5 text-[10px] bg-transparent text-[var(--color-pixel-text)] border-2 border-[var(--color-pixel-secondary)] hover:border-[var(--color-pixel-accent)]"
            >
              Intervene
            </button>
            <button
              onClick={onEnd}
              className="px-3 py-1.5 text-[10px] bg-transparent text-[var(--color-pixel-text-dim)] border-2 border-[#888] hover:border-[var(--color-pixel-accent)]"
            >
              End Debate
            </button>
          </>
        )}

        {isLoading && (
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] animate-pulse">
            Thinking...
          </div>
        )}

        {isComplete && (
          <div className="text-center">
            <div className="text-[10px] text-[var(--color-pixel-success)] mb-2">
              Debate concluded
            </div>
            <button
              onClick={onEnd}
              className="px-4 py-2 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
