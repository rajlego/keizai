export function PCScene() {
  return (
    <div className="absolute inset-0">
      {/* Sky/ceiling gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #2d1b4e 0%, #1a1a3e 40%, #0d0d1a 100%)',
        }}
      />

      {/* Wall with texture */}
      <div
        className="absolute top-0 left-0 right-0 h-[40%]"
        style={{
          background: '#2a2040',
          borderBottom: '4px solid #1a1030',
        }}
      >
        {/* Wallpaper pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Window (left) */}
      <div
        className="absolute top-[8%] left-[8%] w-[15%] h-[25%] border-4 border-[#4a3a5a] bg-[#1a2a4a]"
      >
        <div className="absolute inset-1 border-2 border-[#4a3a5a]" />
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#4a3a5a]" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#4a3a5a]" />
        {/* Moon */}
        <div className="absolute top-[15%] right-[20%] w-4 h-4 bg-[#ffe4a0] rounded-full opacity-80" />
        {/* Stars */}
        <div className="absolute top-[30%] left-[20%] w-1 h-1 bg-white rounded-full" />
        <div className="absolute top-[50%] left-[60%] w-1 h-1 bg-white rounded-full" />
        <div className="absolute top-[25%] left-[40%] w-1 h-1 bg-white rounded-full opacity-50" />
      </div>

      {/* Window (right) */}
      <div
        className="absolute top-[8%] right-[8%] w-[15%] h-[25%] border-4 border-[#4a3a5a] bg-[#1a2a4a]"
      >
        <div className="absolute inset-1 border-2 border-[#4a3a5a]" />
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#4a3a5a]" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#4a3a5a]" />
        {/* Stars */}
        <div className="absolute top-[20%] left-[30%] w-1 h-1 bg-white rounded-full" />
        <div className="absolute top-[40%] right-[30%] w-1 h-1 bg-white rounded-full" />
      </div>

      {/* Bookshelf (left wall) */}
      <div className="absolute top-[15%] left-[28%] w-[12%] h-[20%] bg-[#4a3728] border-2 border-[#3a2718]">
        <div className="absolute top-[20%] left-1 right-1 h-[25%] bg-[#3a2718] flex items-center justify-center">
          <span className="text-[8px]">📚</span>
        </div>
        <div className="absolute top-[55%] left-1 right-1 h-[25%] bg-[#3a2718] flex items-center justify-center">
          <span className="text-[8px]">📖</span>
        </div>
      </div>

      {/* Picture frame (center wall) */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[10%] h-[15%] border-4 border-[#8a7a5a] bg-[#2a2a3a]">
        <div className="absolute inset-1 border border-[#6a5a4a]" />
        <div className="text-center pt-[20%] text-lg">🖼️</div>
      </div>

      {/* Floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%]"
        style={{
          background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b0f 100%)',
          borderTop: '4px solid #1a0f05',
        }}
      >
        {/* Floor boards pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 48px,
                rgba(0,0,0,0.4) 48px,
                rgba(0,0,0,0.4) 50px
              )
            `,
          }}
        />
      </div>

      {/* Couch/seating area (center) */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[30%] h-[15%] bg-[#5a4a3a] border-4 border-[#4a3a2a] rounded-t-lg">
        <div className="absolute -top-2 left-[10%] right-[10%] h-4 bg-[#5a4a3a] border-2 border-[#4a3a2a] rounded-t-lg" />
        {/* Cushions */}
        <div className="absolute top-2 left-[5%] w-[28%] h-[60%] bg-[#6a5a4a] rounded" />
        <div className="absolute top-2 left-[36%] w-[28%] h-[60%] bg-[#6a5a4a] rounded" />
        <div className="absolute top-2 right-[5%] w-[28%] h-[60%] bg-[#6a5a4a] rounded" />
      </div>

      {/* Coffee table */}
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[20%] h-[6%] bg-[#4a3a2a] border-2 border-[#3a2a1a]">
        {/* Items on table */}
        <div className="absolute -top-2 left-[20%] text-sm">☕</div>
        <div className="absolute -top-2 right-[20%] text-sm">📜</div>
      </div>

      {/* Side table (left) */}
      <div className="absolute bottom-[18%] left-[5%] w-[8%] h-[12%] bg-[#4a3a2a] border-2 border-[#3a2a1a]">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">🪴</div>
      </div>

      {/* Lamp (right) */}
      <div className="absolute bottom-[18%] right-[5%] w-[6%] h-[18%]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-[#3a3a3a] border-2 border-[#2a2a2a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[40%] bg-[#ffd700] border-2 border-[#cca000] rounded-t-full opacity-80" />
        {/* Light glow */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #ffd700 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Rug */}
      <div
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[50%] h-[8%] rounded-full opacity-60"
        style={{
          background: 'linear-gradient(90deg, #8a4a4a, #6a3a3a, #8a4a4a)',
          border: '2px solid #5a2a2a',
        }}
      />

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#ffd700] rounded-full opacity-20 animate-float"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 15}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + i}s`,
            }}
          />
        ))}
      </div>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.2; }
          50% { transform: translateY(-15px); opacity: 0.4; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
