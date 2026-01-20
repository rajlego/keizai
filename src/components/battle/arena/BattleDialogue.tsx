import { useEffect, useRef } from 'react';
import type { BattleAction, BattleCharacter } from '../../../models/types';

interface BattleDialogueProps {
  actions: BattleAction[];
  characters: Map<string, BattleCharacter>;
  currentDialogue?: {
    characterId: string;
    text: string;
    isStreaming: boolean;
  };
  maxHeight?: string;
}

export function BattleDialogue({
  actions,
  characters,
  currentDialogue,
  maxHeight = '200px',
}: BattleDialogueProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions, currentDialogue]);

  const getCharacter = (id: string): BattleCharacter | undefined => {
    return characters.get(id);
  };

  const getActionColor = (action: BattleAction): string => {
    switch (action.actionType) {
      case 'attack': return 'var(--color-pixel-error)';
      case 'understand': return 'var(--color-pixel-primary)';
      case 'negotiate': return 'var(--color-pixel-success)';
      case 'support': return 'var(--color-pixel-success)';
      case 'defend': return 'var(--color-pixel-warning)';
      case 'special': return 'var(--color-pixel-accent)';
      default: return 'var(--color-pixel-text)';
    }
  };

  const getActionIcon = (actionType: string): string => {
    switch (actionType) {
      case 'attack': return '⚔️';
      case 'understand': return '💭';
      case 'negotiate': return '🤝';
      case 'support': return '💚';
      case 'defend': return '🛡️';
      case 'special': return '✨';
      default: return '•';
    }
  };

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)]">
      {/* Header */}
      <div className="px-3 py-2 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-bg)]">
        <h4 className="text-[10px] text-[var(--color-pixel-text-dim)]">Battle Log</h4>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="p-3 overflow-y-auto"
        style={{ maxHeight }}
      >
        {actions.length === 0 && !currentDialogue && (
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] text-center py-4">
            The battle begins...
          </div>
        )}

        {actions.map(action => {
          const character = getCharacter(action.characterId);
          const isVillain = character?.role === 'villain';

          return (
            <div
              key={action.id}
              className={`mb-3 ${isVillain ? 'text-right' : 'text-left'}`}
            >
              {/* Action indicator */}
              <div className="flex items-center gap-1 mb-1" style={{ justifyContent: isVillain ? 'flex-end' : 'flex-start' }}>
                <span className="text-[12px]">{getActionIcon(action.actionType)}</span>
                <span
                  className="text-[8px] font-bold"
                  style={{ color: getActionColor(action) }}
                >
                  {action.actionType.toUpperCase()}
                </span>
              </div>

              {/* Character name and dialogue */}
              <div
                className={`
                  inline-block px-3 py-2 max-w-[85%] border-2
                  ${isVillain
                    ? 'bg-[var(--color-pixel-error)]/10 border-[var(--color-pixel-error)]'
                    : 'bg-[var(--color-pixel-primary)]/10 border-[var(--color-pixel-primary)]'
                  }
                `}
              >
                <div
                  className="text-[9px] font-bold mb-1"
                  style={{ color: isVillain ? 'var(--color-pixel-error)' : 'var(--color-pixel-accent)' }}
                >
                  {character?.name ?? 'Unknown'}
                </div>
                <div className="text-[10px] text-[var(--color-pixel-text)]">
                  "{action.dialogue}"
                </div>
              </div>

              {/* Narration */}
              <div className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1 italic">
                {action.narration}
              </div>

              {/* Effects */}
              {(action.damage || action.healing || action.trustDelta || action.understandingDelta) && (
                <div className="flex gap-2 mt-1" style={{ justifyContent: isVillain ? 'flex-end' : 'flex-start' }}>
                  {action.damage && (
                    <span className="text-[8px] text-[var(--color-pixel-error)]">
                      -{action.damage} HP
                    </span>
                  )}
                  {action.healing && (
                    <span className="text-[8px] text-[var(--color-pixel-success)]">
                      +{action.healing} HP
                    </span>
                  )}
                  {action.understandingDelta && (
                    <span className="text-[8px] text-[var(--color-pixel-primary)]">
                      +{action.understandingDelta}% Understanding
                    </span>
                  )}
                  {action.trustDelta && (
                    <span className="text-[8px] text-[var(--color-pixel-success)]">
                      +{action.trustDelta}% Trust
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Current streaming dialogue */}
        {currentDialogue && (
          <div
            className={`mb-3 ${
              getCharacter(currentDialogue.characterId)?.role === 'villain' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`
                inline-block px-3 py-2 max-w-[85%] border-2
                ${getCharacter(currentDialogue.characterId)?.role === 'villain'
                  ? 'bg-[var(--color-pixel-error)]/10 border-[var(--color-pixel-error)]'
                  : 'bg-[var(--color-pixel-primary)]/10 border-[var(--color-pixel-primary)]'
                }
              `}
            >
              <div
                className="text-[9px] font-bold mb-1"
                style={{
                  color: getCharacter(currentDialogue.characterId)?.role === 'villain'
                    ? 'var(--color-pixel-error)'
                    : 'var(--color-pixel-accent)'
                }}
              >
                {getCharacter(currentDialogue.characterId)?.name ?? 'Unknown'}
              </div>
              <div className="text-[10px] text-[var(--color-pixel-text)]">
                "{currentDialogue.text}
                {currentDialogue.isStreaming && (
                  <span className="inline-block w-2 h-3 bg-[var(--color-pixel-text)] animate-pulse ml-0.5" />
                )}
                "
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
