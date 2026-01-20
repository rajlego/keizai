import type { Battle, VictoryType, BattleReward } from '../../../models/types';

interface VictoryScreenProps {
  battle: Battle;
  narrative?: string;
  onClose: () => void;
}

const VICTORY_TITLES: Record<VictoryType, { title: string; subtitle: string; color: string; icon: string }> = {
  integration: {
    title: 'Integration Achieved',
    subtitle: 'The villain has been understood and integrated',
    color: 'var(--color-pixel-primary)',
    icon: '💜',
  },
  negotiation: {
    title: 'Agreement Reached',
    subtitle: 'A healthy boundary has been established',
    color: 'var(--color-pixel-success)',
    icon: '🤝',
  },
  hp_depletion: {
    title: 'Victory!',
    subtitle: 'The inner conflict has been overcome',
    color: 'var(--color-pixel-accent)',
    icon: '⚔️',
  },
  defeat: {
    title: 'Retreat',
    subtitle: 'This battle is lost, but not the war',
    color: 'var(--color-pixel-error)',
    icon: '💔',
  },
  flee: {
    title: 'Strategic Withdrawal',
    subtitle: 'Sometimes retreat is wisdom',
    color: 'var(--color-pixel-warning)',
    icon: '🏃',
  },
};

function RewardItem({ reward }: { reward: BattleReward }) {
  const getIcon = () => {
    switch (reward.type) {
      case 'xp': return '⭐';
      case 'currency': return '💰';
      case 'ability': return '✨';
      case 'insight': return '💡';
      default: return '🎁';
    }
  };

  const getColor = () => {
    switch (reward.type) {
      case 'xp': return 'var(--color-pixel-primary)';
      case 'currency': return 'var(--color-pixel-warning)';
      case 'ability': return 'var(--color-pixel-accent)';
      case 'insight': return 'var(--color-pixel-success)';
      default: return 'var(--color-pixel-text)';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)]">
      <span className="text-[16px]">{getIcon()}</span>
      <div className="flex-1">
        <div className="text-[10px]" style={{ color: getColor() }}>
          {reward.type === 'xp' && `+${reward.amount} XP`}
          {reward.type === 'currency' && `+$${reward.amount}`}
          {reward.type === 'ability' && 'New Ability!'}
          {reward.type === 'insight' && 'Insight Gained'}
        </div>
        <div className="text-[8px] text-[var(--color-pixel-text-dim)]">
          {reward.description}
        </div>
      </div>
    </div>
  );
}

export function VictoryScreen({
  battle,
  narrative,
  onClose,
}: VictoryScreenProps) {
  const victoryType = battle.victoryType ?? 'flee';
  const info = VICTORY_TITLES[victoryType];
  const rewards = battle.rewards ?? [];

  const isPositiveOutcome = victoryType !== 'defeat' && victoryType !== 'flee';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-pixel-surface)] border-4 max-w-lg w-full" style={{ borderColor: info.color }}>
        {/* Header */}
        <div
          className="p-6 text-center"
          style={{ backgroundColor: `color-mix(in srgb, ${info.color} 20%, var(--color-pixel-bg))` }}
        >
          <div className="text-[48px] mb-2">{info.icon}</div>
          <h2 className="text-[24px] font-bold mb-1" style={{ color: info.color }}>
            {info.title}
          </h2>
          <p className="text-[11px] text-[var(--color-pixel-text-dim)]">
            {info.subtitle}
          </p>
        </div>

        {/* Battle Summary */}
        <div className="p-4 border-y-2" style={{ borderColor: info.color }}>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Rounds</div>
              <div className="text-[16px] text-[var(--color-pixel-text)]">{battle.currentRound}</div>
            </div>
            <div>
              <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Villain</div>
              <div className="text-[12px] text-[var(--color-pixel-error)]">{battle.villain.name}</div>
            </div>
            <div>
              <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Heroes</div>
              <div className="text-[16px] text-[var(--color-pixel-text)]">{battle.heroes.length}</div>
            </div>
          </div>

          {/* Final stats */}
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="text-center">
              <div className="text-[var(--color-pixel-text-dim)]">Final HP</div>
              <div className="text-[var(--color-pixel-error)]">
                {battle.villain.health}/{battle.villain.maxHealth}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[var(--color-pixel-text-dim)]">Understanding</div>
              <div className="text-[var(--color-pixel-primary)]">{battle.villain.understanding}%</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--color-pixel-text-dim)]">Trust</div>
              <div className="text-[var(--color-pixel-success)]">{battle.villain.trust}%</div>
            </div>
          </div>
        </div>

        {/* Narrative */}
        {narrative && (
          <div className="p-4 border-b-2" style={{ borderColor: info.color }}>
            <p className="text-[11px] text-[var(--color-pixel-text)] italic text-center">
              "{narrative}"
            </p>
          </div>
        )}

        {/* Rewards */}
        {isPositiveOutcome && rewards.length > 0 && (
          <div className="p-4">
            <h3 className="text-[11px] text-[var(--color-pixel-text-dim)] mb-2">Rewards</h3>
            <div className="space-y-2">
              {rewards.map((reward, i) => (
                <RewardItem key={i} reward={reward} />
              ))}
            </div>
          </div>
        )}

        {/* Core Need Revealed (for integration) */}
        {victoryType === 'integration' && (
          <div className="px-4 pb-4">
            <div className="p-3 bg-[var(--color-pixel-primary)]/10 border border-[var(--color-pixel-primary)]">
              <div className="text-[9px] text-[var(--color-pixel-primary)] mb-1">Core Need Revealed:</div>
              <div className="text-[11px] text-[var(--color-pixel-text)]">
                {battle.villain.coreNeed}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="p-4 bg-[var(--color-pixel-bg)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-[12px] font-bold text-black border-4 hover:brightness-110"
            style={{ backgroundColor: info.color, borderColor: info.color }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
