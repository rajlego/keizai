import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useParts } from '../../hooks/useParts';
import { useGameStateActions } from '../../hooks/useGameState';
import { HubView } from '../styles/persona-hub/HubView';
import { VNView } from '../styles/visual-novel/VNView';
import { RPGView } from '../styles/top-down/RPGView';
import { PCView } from '../styles/point-click/PCView';
import { GameStyleSelector } from './GameStyleSelector';

export function GameView() {
  const gameStyle = useSettingsStore((state) => state.gameStyle);
  const claudeApiKey = useSettingsStore((state) => state.claudeApiKey);
  const parts = useParts();
  const { initializePartStates } = useGameStateActions();

  // Initialize part states when parts change
  useEffect(() => {
    const partIds = parts.map(p => p.id);
    if (partIds.length > 0) {
      initializePartStates(partIds);
    }
  }, [parts, initializePartStates]);

  // Show setup screen if no API key or no parts
  if (!claudeApiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-[var(--color-pixel-primary)] text-[14px] mb-4">
            Game Mode Setup
          </h2>
          <p className="text-[var(--color-pixel-text)] text-[11px] mb-4">
            To interact with your parts as characters, you need to configure a Claude API key.
          </p>
          <p className="text-[var(--color-pixel-text-dim)] text-[10px] mb-6">
            Go to Settings → Game → Claude API Key to add your key.
          </p>
          <div className="border-2 border-[var(--color-pixel-secondary)] p-4 bg-[var(--color-pixel-surface)]">
            <p className="text-[var(--color-pixel-accent)] text-[10px]">
              Get an API key from console.anthropic.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-[var(--color-pixel-primary)] text-[14px] mb-4">
            No Parts Found
          </h2>
          <p className="text-[var(--color-pixel-text)] text-[11px] mb-4">
            Create some IFS parts first to populate your game world.
          </p>
          <p className="text-[var(--color-pixel-text-dim)] text-[10px]">
            Go to the Parts view [2] to create parts.
          </p>
        </div>
      </div>
    );
  }

  // Render the selected game style
  const renderGameStyle = () => {
    switch (gameStyle) {
      case 'visual-novel':
        return <VNView />;
      case 'persona-hub':
        return <HubView />;
      case 'top-down-rpg':
        return <RPGView />;
      case 'point-click':
        return <PCView />;
      default:
        return <HubView />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Style selector bar */}
      <div className="flex-shrink-0 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] px-2 py-1">
        <GameStyleSelector />
      </div>

      {/* Game content */}
      <div className="flex-1 overflow-hidden">
        {renderGameStyle()}
      </div>
    </div>
  );
}
