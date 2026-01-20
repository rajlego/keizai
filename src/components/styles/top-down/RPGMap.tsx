export function RPGMap() {
  return (
    <div className="absolute inset-0">
      {/* Base grass layer */}
      <div
        className="absolute inset-0"
        style={{
          background: '#1a3d1a',
          imageRendering: 'pixelated',
        }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '10% 14.28%',
        }}
      />

      {/* Grass tufts */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-[10px] opacity-40"
            style={{
              left: `${(i * 17) % 95}%`,
              top: `${(i * 13) % 90}%`,
            }}
          >
            {i % 3 === 0 ? ',' : i % 3 === 1 ? '`' : '.'}
          </div>
        ))}
      </div>

      {/* Path/walkway in center */}
      <div
        className="absolute"
        style={{
          left: '35%',
          right: '35%',
          top: '40%',
          bottom: '40%',
          background: '#3d3028',
          border: '2px solid #2d2018',
        }}
      />

      {/* Trees/decorations */}
      <div className="absolute top-[5%] left-[5%] text-2xl">🌲</div>
      <div className="absolute top-[5%] right-[5%] text-2xl">🌲</div>
      <div className="absolute bottom-[5%] left-[5%] text-2xl">🌲</div>
      <div className="absolute bottom-[5%] right-[5%] text-2xl">🌲</div>
      <div className="absolute top-[20%] left-[15%] text-xl">🌳</div>
      <div className="absolute top-[20%] right-[15%] text-xl">🌳</div>

      {/* Rocks */}
      <div className="absolute bottom-[20%] left-[20%] text-lg opacity-60">🪨</div>
      <div className="absolute top-[35%] right-[8%] text-lg opacity-60">🪨</div>

      {/* Flowers */}
      <div className="absolute top-[60%] left-[25%] text-sm">🌸</div>
      <div className="absolute top-[25%] left-[40%] text-sm">🌼</div>
      <div className="absolute bottom-[30%] right-[30%] text-sm">🌸</div>

      {/* Central meeting area */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-4 border-[#4a3a2a] bg-[#5a4a3a] flex items-center justify-center"
      >
        <div className="text-2xl">🪑</div>
      </div>

      {/* Campfire/gathering point */}
      <div className="absolute left-1/2 bottom-[25%] -translate-x-1/2 text-xl animate-pulse">
        🔥
      </div>
    </div>
  );
}
