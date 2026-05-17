'use client';

const N = 22;

export default function BloodshotLoader({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[300px] h-10 rounded-full bg-black/70 border border-white/8 shadow-[0_0_50px_-12px_rgba(220,38,38,0.6)] overflow-hidden">
        {/* Inner glow that intensifies with progress */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.25), transparent 65%)',
            opacity: 0.3 + progress * 0.7,
          }}
        />

        {/* Sunset progress underline */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300 transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress * 100)}%`, boxShadow: '0 0 10px rgba(255,61,138,0.9)' }}
          />
        </div>

        {/* The eyes — appear one by one */}
        <div className="absolute inset-0 flex items-center justify-between px-3">
          {Array.from({ length: N }).map((_, i) => (
            <Eye key={i} lit={progress >= (i + 1) / N} index={i} />
          ))}
        </div>

        {/* Scan line sweeping across */}
        <div className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 w-px scan"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(255,61,138,0.9), transparent)',
              boxShadow: '0 0 12px rgba(255,61,138,0.85)',
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

function Eye({ lit, index }: { lit: boolean; index: number }) {
  // Deterministic gaze
  const seed = index * 137 + 23;
  const angle = (seed * 1.3) % 360;
  const dx = Math.cos((angle * Math.PI) / 180) * 1.3;
  const dy = Math.sin((angle * Math.PI) / 180) * 0.7;

  return (
    <div
      className={lit ? 'eye-twitch' : ''}
      style={{ animationDelay: `${index * 0.13}s` }}
    >
      <svg
        viewBox="0 0 40 40"
        className="w-4 h-4 transition-all duration-300"
        style={{
          opacity: lit ? 1 : 0,
          transform: lit ? 'scale(1)' : 'scale(0.3)',
          filter: lit ? 'drop-shadow(0 0 4px rgba(220,38,38,0.8))' : 'none',
        }}
      >
        {/* Almond sclera */}
        <ellipse cx="20" cy="20" rx="18" ry="13" fill="#fef4e0" />

        {/* Veins */}
        <path d="M 3 18 Q 10 14 17 18" stroke="#dc2626" fill="none" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M 3 23 Q 10 24 17 22" stroke="#991b1b" fill="none" strokeWidth="1"   strokeLinecap="round" />
        <path d="M 5 26 Q 11 28 17 25" stroke="#b91c1c" fill="none" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 37 18 Q 30 14 23 18" stroke="#dc2626" fill="none" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M 37 23 Q 30 24 23 22" stroke="#991b1b" fill="none" strokeWidth="1"   strokeLinecap="round" />
        <path d="M 35 26 Q 29 28 23 25" stroke="#b91c1c" fill="none" strokeWidth="0.9" strokeLinecap="round" />

        {/* Iris */}
        <circle cx={20 + dx} cy={20 + dy} r="7.5" fill="#1a0a0a" />
        <circle cx={20 + dx} cy={20 + dy} r="6.5" fill="#3a1810" />
        <circle cx={20 + dx} cy={20 + dy} r="4.5" fill="#5b1f12" />

        {/* Pupil */}
        <circle cx={20 + dx} cy={20 + dy} r="3" fill="#000" />

        {/* Highlight */}
        <ellipse cx={18 + dx} cy={18 + dy} rx="1.2" ry="0.9" fill="#fff" opacity="0.9" />
      </svg>
    </div>
  );
}
