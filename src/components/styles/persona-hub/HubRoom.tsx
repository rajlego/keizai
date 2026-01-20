import type { ReactNode } from 'react';

interface HubRoomProps {
  children: ReactNode;
}

export function HubRoom({ children }: HubRoomProps) {
  return (
    <div
      className="relative w-full h-full"
      style={{
        background: `
          linear-gradient(180deg,
            var(--color-pixel-bg) 0%,
            #1a1a3e 50%,
            #0f0f2e 100%
          )
        `,
      }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-pixel-secondary) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-pixel-secondary) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Decorative elements - furniture/items */}
      <div className="absolute top-4 left-4 w-16 h-16 border-4 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)]">
        <div className="text-center pt-2 text-[20px]">📚</div>
        <div className="text-center text-[7px] text-[var(--color-pixel-text-dim)]">Bookshelf</div>
      </div>

      <div className="absolute top-4 right-4 w-20 h-12 border-4 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)]">
        <div className="text-center text-[16px]">🖼️</div>
        <div className="text-center text-[7px] text-[var(--color-pixel-text-dim)]">Memories</div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 border-4 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)]">
        <div className="text-center text-[7px] text-[var(--color-pixel-text-dim)] pt-1">
          🛋️ The Self's Space
        </div>
      </div>

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[var(--color-pixel-accent)] rounded-full opacity-30 animate-float"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }}
          />
        ))}
      </div>

      {/* Characters container */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* Add floating animation keyframes via style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.6; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
