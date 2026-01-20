import { useParts } from '../../../hooks/useParts';

export function RPGView() {
  const parts = useParts();

  return (
    <div
      className="relative w-full h-full"
      style={{
        background: '#1a3d1a',
        imageRendering: 'pixelated',
      }}
    >
      {/* Grid-based map */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 31px,
              rgba(0,0,0,0.2) 31px,
              rgba(0,0,0,0.2) 32px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 31px,
              rgba(0,0,0,0.2) 31px,
              rgba(0,0,0,0.2) 32px
            )
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Grass pattern */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-[8px]"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 100}%`,
            }}
          >
            🌿
          </div>
        ))}
      </div>

      {/* Character sprites as simple squares */}
      <div className="absolute inset-0">
        {parts.slice(0, 4).map((part, index) => (
          <div
            key={part.id}
            className="absolute w-8 h-8 border-2 border-black bg-[var(--color-pixel-accent)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
            style={{
              left: `${25 + (index % 2) * 50}%`,
              top: `${30 + Math.floor(index / 2) * 30}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-[10px] font-bold text-black">
              {part.name.charAt(0)}
            </span>
          </div>
        ))}

        {/* Player sprite */}
        <div
          className="absolute w-8 h-8 border-2 border-black bg-[var(--color-pixel-warning)] flex items-center justify-center"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="text-[10px] font-bold text-black">P</span>
        </div>
      </div>

      {/* Style indicator */}
      <div className="absolute top-2 right-2 text-[8px] text-white bg-black/80 px-2 py-1">
        🎮 Top-Down RPG Mode (Coming Soon)
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 text-[8px] text-white bg-black/80 px-2 py-1">
        Arrow keys to move (not yet implemented)
      </div>
    </div>
  );
}
