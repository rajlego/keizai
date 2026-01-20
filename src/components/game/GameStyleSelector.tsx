import { useSettingsStore } from '../../store/settingsStore';
import type { GameStyle } from '../../models/types';

const GAME_STYLES: { value: GameStyle; label: string; icon: string }[] = [
  { value: 'persona-hub', label: 'Hub', icon: '🏠' },
  { value: 'visual-novel', label: 'VN', icon: '📖' },
  { value: 'top-down-rpg', label: 'RPG', icon: '🗺️' },
  { value: 'point-click', label: 'P&C', icon: '👆' },
];

export function GameStyleSelector() {
  const gameStyle = useSettingsStore((state) => state.gameStyle);
  const setGameStyle = useSettingsStore((state) => state.setGameStyle);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] text-[var(--color-pixel-text-dim)]">Style:</span>
      <div className="flex gap-1">
        {GAME_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => setGameStyle(style.value)}
            className={`
              px-2 py-1 text-[9px] transition-colors border-2
              ${gameStyle === style.value
                ? 'bg-[var(--color-pixel-accent)] text-[var(--color-pixel-bg)] border-[var(--color-pixel-accent)]'
                : 'bg-[var(--color-pixel-bg)] text-[var(--color-pixel-text-dim)] border-[#444] hover:border-[var(--color-pixel-accent)]'
              }
            `}
            title={style.label}
          >
            <span className="mr-1">{style.icon}</span>
            {style.label}
          </button>
        ))}
      </div>
    </div>
  );
}
