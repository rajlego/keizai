interface VNBackgroundProps {
  scene?: 'default' | 'cozy' | 'dramatic' | 'peaceful';
}

const SCENE_GRADIENTS = {
  default: 'linear-gradient(180deg, #1a1a3e 0%, #2d1b4e 30%, #1a2a4a 100%)',
  cozy: 'linear-gradient(180deg, #2d1b0f 0%, #4a3728 30%, #3d2b1f 100%)',
  dramatic: 'linear-gradient(180deg, #1a0a0a 0%, #3d1a1a 30%, #2a1515 100%)',
  peaceful: 'linear-gradient(180deg, #1a3d2a 0%, #2a4d3a 30%, #1a3a2a 100%)',
};

export function VNBackground({ scene = 'default' }: VNBackgroundProps) {
  return (
    <div className="absolute inset-0">
      {/* Main gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: SCENE_GRADIENTS[scene] }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            )
          `,
        }}
      />

      {/* Animated particles/stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 15}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Window frame decoration (top corners) */}
      <div className="absolute top-0 left-0 w-32 h-32 border-b-4 border-r-4 border-[var(--color-pixel-secondary)]/20" />
      <div className="absolute top-0 right-0 w-32 h-32 border-b-4 border-l-4 border-[var(--color-pixel-secondary)]/20" />

      {/* Floor/stage area */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </div>
  );
}
