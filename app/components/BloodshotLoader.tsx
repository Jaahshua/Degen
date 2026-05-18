'use client';

const N = 18;

export default function BloodshotLoader({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative w-[300px] h-7 rounded-full bg-black/70 border border-white/8 shadow-[0_0_36px_-12px_rgba(220,38,38,0.55)] overflow-hidden">
        {/* Inner red glow that intensifies with progress */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.28), transparent 65%)',
            opacity: 0.25 + progress * 0.7,
          }}
        />

        {/* Sunset progress underline */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300 transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress * 100)}%`, boxShadow: '0 0 8px rgba(255,61,138,0.9)' }}
          />
        </div>

        {/* Eyes — small, evenly distributed, appear one by one */}
        <div className="absolute inset-0 flex items-center justify-between px-2.5">
          {Array.from({ length: N }).map((_, i) => (
            <Eye key={i} lit={progress >= (i + 1) / N} />
          ))}
        </div>

        {/* Scan line sweeping across */}
        <div className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 w-px scan"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(255,61,138,0.85), transparent)',
              boxShadow: '0 0 10px rgba(255,61,138,0.85)',
            }}
          />
        </div>
      </div>

      <div className="text-[10px] tracking-[0.5em] text-white/45 font-mono uppercase">
        Eyes Opening · {Math.round(progress * 100).toString().padStart(2, '0')}%
      </div>
    </div>
  );
}

function Eye({ lit }: { lit: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3 h-3 transition-all duration-300"
      style={{
        opacity: lit ? 1 : 0,
        transform: lit ? 'scale(1)' : 'scale(0.4)',
        filter: lit ? 'drop-shadow(0 0 3px rgba(220,38,38,0.75))' : 'none',
      }}
    >
      <circle cx="8" cy="8" r="6.8" fill="#fef4e0" />
      <path d="M 1.5 6.5 Q 4 5 6.5 7"  stroke="#dc2626" fill="none" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M 1.5 9.5 Q 4 10.5 6.5 9" stroke="#991b1b" fill="none" strokeWidth="0.65" strokeLinecap="round" />
      <path d="M 14.5 6.5 Q 12 5 9.5 7"  stroke="#dc2626" fill="none" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M 14.5 9.5 Q 12 10.5 9.5 9" stroke="#991b1b" fill="none" strokeWidth="0.65" strokeLinecap="round" />
      <circle cx="8" cy="8" r="3.2" fill="#3a1810" />
      <circle cx="8" cy="8" r="2"   fill="#000" />
      <circle cx="7.2" cy="7.2" r="0.55" fill="#fff" opacity="0.9" />
    </svg>
  );
}
