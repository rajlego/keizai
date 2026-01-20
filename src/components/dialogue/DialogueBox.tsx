import { useState, useEffect } from 'react';
import type { Part, PartMood, ConversationMessage } from '../../models/types';
import { CharacterPortrait } from './CharacterPortrait';
import { TypewriterText } from './TypewriterText';
import { ResponseChoices } from './ResponseChoices';

interface DialogueBoxProps {
  part: Part;
  mood?: PartMood;
  message: string;
  isStreaming?: boolean;
  choices?: string[];
  isGeneratingChoices?: boolean;
  onChoiceSelect?: (choice: string) => void;
  onCustomResponse?: (response: string) => void;
  onClose?: () => void;
  showHistory?: boolean;
  history?: ConversationMessage[];
  className?: string;
}

export function DialogueBox({
  part,
  mood = 'neutral',
  message,
  isStreaming = false,
  choices = [],
  isGeneratingChoices = false,
  onChoiceSelect,
  onCustomResponse,
  onClose,
  showHistory = false,
  history = [],
  className = '',
}: DialogueBoxProps) {
  const [showChoices, setShowChoices] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Show choices after message is complete
  useEffect(() => {
    if (!isStreaming && message && choices.length > 0) {
      setShowChoices(true);
    }
  }, [isStreaming, message, choices]);

  const handleChoiceSelect = (choice: string) => {
    setShowChoices(false);
    onChoiceSelect?.(choice);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setShowChoices(false);
      onCustomResponse?.(customInput.trim());
      setCustomInput('');
    }
  };

  return (
    <div className={`bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] ${className}`}>
      {/* Header with close button */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[var(--color-pixel-secondary)]">
        <div className="flex items-center gap-3">
          <CharacterPortrait part={part} mood={mood} size="sm" showName={false} showMood />
          <span className="text-[var(--color-pixel-text)] text-[12px] font-bold">
            {part.name}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--color-pixel-text-dim)] hover:text-[var(--color-pixel-error)] text-[14px]"
          >
            ×
          </button>
        )}
      </div>

      {/* Message history (optional) */}
      {showHistory && history.length > 0 && (
        <div className="max-h-32 overflow-y-auto px-3 py-2 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-bg)]">
          {history.slice(-5).map((msg, i) => (
            <div key={msg.id || i} className="text-[10px] mb-1">
              <span className={msg.role === 'user' ? 'text-[var(--color-pixel-accent)]' : 'text-[var(--color-pixel-text-dim)]'}>
                {msg.role === 'user' ? 'You' : part.name}:
              </span>{' '}
              <span className="text-[var(--color-pixel-text)]">{msg.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main message area */}
      <div className="px-4 py-3 min-h-[80px]">
        <TypewriterText
          text={message}
          isStreaming={isStreaming}
          speed={25}
          className="text-[var(--color-pixel-text)] text-[11px] leading-relaxed"
        />
      </div>

      {/* Response choices */}
      {showChoices && !isStreaming && (
        <div className="px-3 pb-3 border-t-2 border-[var(--color-pixel-secondary)]">
          {isGeneratingChoices ? (
            <div className="text-[10px] text-[var(--color-pixel-text-dim)] py-2 animate-pulse">
              Generating responses...
            </div>
          ) : (
            <>
              <ResponseChoices
                choices={choices}
                onSelect={handleChoiceSelect}
              />

              {/* Custom response input */}
              {onCustomResponse && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                    placeholder="Or type your own response..."
                    className="flex-1 px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#666] text-[var(--color-pixel-text)] text-[10px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customInput.trim()}
                    className="px-2 py-1 bg-[var(--color-pixel-accent)] text-[var(--color-pixel-bg)] text-[10px] disabled:opacity-50 hover:brightness-110"
                  >
                    Send
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Loading indicator when waiting for response */}
      {isStreaming && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-[var(--color-pixel-text-dim)]">
            {part.name} is typing...
          </span>
        </div>
      )}
    </div>
  );
}
