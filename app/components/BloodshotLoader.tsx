'use client';

const N = 12;

export default function BloodshotLoader({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-[300px] h-[52px] rounded-full bg-black/75 border-2 border-white/12 shadow-[0_8px_40px_-10px_rgba(220,38,38,0.6),inset_0_0_24px_rgba(220,38,38,0.18)]">
        {/* Subtle inner red ambience that intensifies with progress */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.22), transparent 70%)',
            opacity: 0.25 + progress * 0.6,
          }}
        />

        {/* Eyes — clearly visible, evenly distributed, appear left -> right */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          {Array.from({ length: N }).map((_, i) => (
            <Eye key={i} lit={progress >= (i + 1) / N} />
          ))}
        </div>

        {/* Sunset progress underline */}
        <div className="absolute bottom-1 left-3 right-3 h-[3px] rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300 transition-[width] duration-200 ease-out"
            style={{ width: `${Math.round(progress * 100)}%`, boxShadow: '0 0 10px rgba(255,61,138,0.9)' }}
          />
        </div>

        {/* Scan-line sweep */}
        <div className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute top-1 bottom-1 w-px scan"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(255,61,138,0.85), transparent)',
              boxShadow: '0 0 10px rgba(255,61,138,0.85)',
            }}
          />
        </div>
      </div>

      <div className="text-[11px] tracking-[0.55em] text-white/55 font-mono uppercase font-bold shadow-glow-pink">
        Opening The Eyes
      </div>
    </div>
  );
}

function Eye({ lit }: { lit: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-[18px] h-[18px] transition-all duration-400"
      style={{
        opacity: lit ? 1 : 0.5,
        filter: lit ? 'drop-shadow(0 0 5px rgba(220,38,38,0.7))' : 'none',
      }}
    >
      {lit ? (
        <g>
          {/* Sclera (almond) */}
          <ellipse cx="12" cy="12" rx="11" ry="8" fill="#fef4e0" />
          {/* Veins */}
          <path d="M 2 10 Q 7 8 11 10" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 2 14 Q 7 16 11 14" stroke="#991b1b" fill="none" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M 22 10 Q 17 8 13 10" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 22 14 Q 17 16 13 14" stroke="#991b1b" fill="none" strokeWidth="0.8" strokeLinecap="round" />
          {/* Iris */}
          <circle cx="12" cy="12" r="5" fill="#1a0a0a" />
          <circle cx="12" cy="12" r="4.2" fill="#3a1810" />
          <circle cx="12" cy="12" r="3" fill="#5b1f12" />
          {/* Pupil */}
          <circle cx="12" cy="12" r="1.9" fill="#000" />
          {/* Highlight */}
          <circle cx="10.8" cy="10.8" r="0.7" fill="#fff" opacity="0.9" />
        </g>
      ) : (
        // Empty slot — closed eye outline (Figz-style gray ghost)
        <g>
          <ellipse cx="12" cy="12" rx="10.5" ry="7" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
        </g>
      )}
    </svg>
  );
}
