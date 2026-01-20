import type { BattleActionType, BattleCharacter } from '../../../models/types';
import { HERO_ARCHETYPES } from '../../../models/types';

interface ActionPanelProps {
  character: BattleCharacter;
  villain: BattleCharacter;
  allies: BattleCharacter[];
  onSelectAction: (actionType: BattleActionType, targetId: string) => void;
  disabled?: boolean;
}

interface ActionDefinition {
  type: BattleActionType;
  label: string;
  description: string;
  icon: string;
  color: string;
  targetType: 'villain' | 'ally' | 'self' | 'any';
}

const ACTIONS: ActionDefinition[] = [
  {
    type: 'attack',
    label: 'Attack',
    description: 'Direct confrontation, damages HP',
    icon: '⚔️',
    color: 'var(--color-pixel-error)',
    targetType: 'villain',
  },
  {
    type: 'understand',
    label: 'Understand',
    description: "Explore the villain's pain (+understanding)",
    icon: '💭',
    color: 'var(--color-pixel-primary)',
    targetType: 'villain',
  },
  {
    type: 'negotiate',
    label: 'Negotiate',
    description: 'Seek common ground (+trust)',
    icon: '🤝',
    color: 'var(--color-pixel-success)',
    targetType: 'villain',
  },
  {
    type: 'support',
    label: 'Support',
    description: 'Heal or buff an ally',
    icon: '💚',
    color: 'var(--color-pixel-success)',
    targetType: 'ally',
  },
  {
    type: 'defend',
    label: 'Defend',
    description: 'Protect yourself or ally',
    icon: '🛡️',
    color: 'var(--color-pixel-warning)',
    targetType: 'self',
  },
  {
    type: 'special',
    label: 'Special',
    description: 'Use unique ability',
    icon: '✨',
    color: 'var(--color-pixel-accent)',
    targetType: 'villain',
  },
];

export function ActionPanel({
  character,
  villain,
  allies,
  onSelectAction,
  disabled = false,
}: ActionPanelProps) {
  // Get special ability name from archetype
  const getSpecialName = () => {
    if (character.archetype && character.archetype !== 'custom') {
      const def = HERO_ARCHETYPES[character.archetype];
      return def.specialAbility.split(' - ')[0];
    }
    return 'Special Ability';
  };

  const handleAction = (action: ActionDefinition) => {
    if (disabled) return;

    // Determine target based on action type
    let targetId: string;

    switch (action.targetType) {
      case 'villain':
        targetId = villain.id;
        break;
      case 'ally':
        // For now, default to first ally or self
        targetId = allies.length > 0 ? allies[0].id : character.id;
        break;
      case 'self':
        targetId = character.id;
        break;
      default:
        targetId = villain.id;
    }

    onSelectAction(action.type, targetId);
  };

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] p-3">
      {/* Current Character Info */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--color-pixel-secondary)]">
        <div className="w-8 h-8 border-2 border-[var(--color-pixel-accent)] overflow-hidden">
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[14px]">⚔️</div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-[11px] text-[var(--color-pixel-accent)] font-bold">
            {character.name}'s Turn
          </div>
          <div className="text-[8px] text-[var(--color-pixel-text-dim)]">
            Choose an action
          </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(action => (
          <button
            key={action.type}
            onClick={() => handleAction(action)}
            disabled={disabled || (action.targetType === 'ally' && allies.length === 0 && action.type === 'support')}
            className={`
              p-2 border-2 text-center transition-all
              ${disabled
                ? 'opacity-50 cursor-not-allowed border-[#888]'
                : 'hover:brightness-110 cursor-pointer'
              }
            `}
            style={{
              borderColor: disabled ? '#888' : action.color,
              backgroundColor: 'var(--color-pixel-bg)',
            }}
          >
            <div className="text-[16px] mb-1">{action.icon}</div>
            <div className="text-[9px] font-bold" style={{ color: action.color }}>
              {action.type === 'special' ? getSpecialName() : action.label}
            </div>
            <div className="text-[7px] text-[var(--color-pixel-text-dim)]">
              {action.description}
            </div>
          </button>
        ))}
      </div>

      {/* Quick Target Indicator */}
      <div className="mt-2 text-[8px] text-[var(--color-pixel-text-dim)] text-center">
        Target: <span className="text-[var(--color-pixel-error)]">{villain.name}</span>
      </div>
    </div>
  );
}
