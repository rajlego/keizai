import { useParts } from '../../../hooks/useParts';

export function VNView() {
  const parts = useParts();

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #2a1a4a 0%, #1a1a3e 100%)',
      }}
    >
      {/* Characters at bottom */}
      <div className="flex-1 relative">
        <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end px-8 pb-4">
          {parts.slice(0, 3).map((part, index) => (
            <div
              key={part.id}
              className="text-center"
              style={{
                transform: index === 1 ? 'scale(1.1)' : 'scale(0.9)',
                opacity: index === 1 ? 1 : 0.7,
              }}
            >
              <div className="w-32 h-48 border-4 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] flex items-center justify-center">
                {part.avatarUrl ? (
                  <img src={part.avatarUrl} alt={part.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{part.name.charAt(0)}</span>
                )}
              </div>
              <div className="text-[10px] text-[var(--color-pixel-text)] mt-1">{part.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Text box */}
      <div className="h-40 border-t-4 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] p-4">
        <div className="text-[var(--color-pixel-accent)] text-[12px] mb-2">
          {parts[0]?.name ?? 'Part'}
        </div>
        <div className="text-[var(--color-pixel-text)] text-[11px]">
          Visual Novel mode is under development. Click on parts to talk in Hub mode.
        </div>
      </div>

      {/* Style indicator */}
      <div className="absolute top-2 right-2 text-[8px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/80 px-2 py-1">
        📖 Visual Novel Mode (Coming Soon)
      </div>
    </div>
  );
}
