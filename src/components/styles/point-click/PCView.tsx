import { useParts } from '../../../hooks/useParts';

export function PCView() {
  const parts = useParts();

  return (
    <div
      className="relative w-full h-full cursor-crosshair"
      style={{
        background: 'linear-gradient(180deg, #2d1b4e 0%, #1a1a3e 40%, #0d0d1a 100%)',
      }}
    >
      {/* Room scene - desk/table area */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b0f 100%)',
          borderTop: '4px solid #1a0f05',
        }}
      >
        {/* Floor pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 48px,
                rgba(0,0,0,0.3) 48px,
                rgba(0,0,0,0.3) 50px
              )
            `,
          }}
        />
      </div>

      {/* Desk/table in center */}
      <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-48 h-16 bg-[#4a3728] border-4 border-[#2d1b0f]">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[20px]">📚</div>
      </div>

      {/* Clickable character hotspots */}
      {parts.slice(0, 3).map((part, index) => (
        <div
          key={part.id}
          className="absolute group cursor-pointer"
          style={{
            left: `${20 + index * 30}%`,
            bottom: '35%',
          }}
        >
          {/* Character silhouette */}
          <div className="w-16 h-24 border-4 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] flex flex-col items-center justify-center group-hover:border-[var(--color-pixel-accent)] transition-colors">
            {part.avatarUrl ? (
              <img src={part.avatarUrl} alt={part.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{part.name.charAt(0)}</span>
            )}
          </div>

          {/* Name label */}
          <div className="text-center text-[9px] text-[var(--color-pixel-text)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {part.name}
          </div>

          {/* Click highlight effect */}
          <div className="absolute inset-0 border-2 border-[var(--color-pixel-accent)] opacity-0 group-hover:opacity-100 animate-pulse" />
        </div>
      ))}

      {/* Window in background */}
      <div className="absolute top-4 right-8 w-20 h-24 border-4 border-[var(--color-pixel-secondary)] bg-[#1a2a4a]">
        <div className="absolute inset-1 border border-[var(--color-pixel-secondary)]" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[var(--color-pixel-secondary)]" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[var(--color-pixel-secondary)]" />
        {/* Stars in window */}
        <div className="absolute top-2 left-3 w-1 h-1 bg-white rounded-full" />
        <div className="absolute top-4 right-4 w-1 h-1 bg-white rounded-full" />
      </div>

      {/* Door on left */}
      <div className="absolute left-4 bottom-[33%] w-12 h-20 border-4 border-[var(--color-pixel-secondary)] bg-[#4a3a2a] cursor-pointer hover:bg-[#5a4a3a] transition-colors">
        <div className="absolute top-1/2 right-2 w-2 h-2 rounded-full bg-[var(--color-pixel-accent)]" />
      </div>

      {/* Style indicator */}
      <div className="absolute top-2 right-2 text-[8px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/80 px-2 py-1">
        🖱️ Point & Click Mode (Coming Soon)
      </div>

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-[8px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)]/80 px-2 py-1">
        Click on characters to interact
      </div>
    </div>
  );
}
