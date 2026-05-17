'use client';

const N = 12;

export default function BloodshotLoader({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative flex items-end justify-center gap-[6px] px-3 py-2 rounded-full bg-black/60 border border-white/8 shadow-[0_0_40px_-8px_rgba(220,38,38,0.55)]">
        {Array.from({ length: N }).map((_, i) => (
          <Eye key={i} lit={progress >= (i + 1) / N} index={i} />
        ))}
        <span className="pointer-events-none absolute inset-0 rounded-full" style={{
          background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15), transparent 70%)',
        }} />
      </div>
      <div className="text-[10px] tracking-[0.4em] text-white/45 font-mono uppercase">
        Eyes Opening · {Math.round(progress * 100)}%
      </div>
    </div>
  );
}

function Eye({ lit, index }: { lit: boolean; index: number }) {
  // Deterministic look direction so each eye stares somewhere different.
  const angle = (index * 137.5 + 23) % 360;
  const r = 2;
  const dx = Math.cos((angle * Math.PI) / 180) * r;
  const dy = Math.sin((angle * Math.PI) / 180) * r * 0.6;

  return (
    <svg
      viewBox="0 0 40 40"
      className="w-6 h-6 transition-all duration-500"
      style={{
        opacity: lit ? 1 : 0.35,
        transform: lit ? 'scale(1)' : 'scale(0.75)',
        filter: lit ? 'drop-shadow(0 0 6px rgba(220,38,38,0.65))' : 'none',
      }}
    >
      {lit ? (
        <g>
          {/* Sclera */}
          <ellipse cx="20" cy="20" rx="18" ry="14" fill="#f8efe6" />
          {/* Veins */}
          <path d="M 3 17 Q 11 14 18 17" stroke="#dc2626" fill="none" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 2 22 Q 10 22 18 21" stroke="#991b1b" fill="none" strokeWidth="1"   strokeLinecap="round" />
          <path d="M 4 25 Q 11 27 17 24" stroke="#b91c1c" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 37 17 Q 29 14 22 17" stroke="#dc2626" fill="none" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 38 22 Q 30 22 22 21" stroke="#991b1b" fill="none" strokeWidth="1"   strokeLinecap="round" />
          <path d="M 36 26 Q 29 27 23 25" stroke="#b91c1c" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 20 7  Q 22 13 20 18" stroke="#7f1d1d" fill="none" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M 20 33 Q 18 27 20 22" stroke="#7f1d1d" fill="none" strokeWidth="0.8" strokeLinecap="round" />
          {/* Iris */}
          <circle cx={20 + dx} cy={20 + dy} r="6.4" fill="#3a1810" />
          <circle cx={20 + dx} cy={20 + dy} r="5.2" fill="#5b1f12" />
          <circle cx={20 + dx} cy={20 + dy} r="3"   fill="#000" />
          <circle cx={18 + dx} cy={18 + dy} r="1.1" fill="#ffffff" opacity="0.85" />
          {/* Eyelid bottom shadow */}
          <path d="M 2 24 Q 20 36 38 24" fill="rgba(60,15,15,0.25)" />
        </g>
      ) : (
        <ellipse cx="20" cy="22" rx="16" ry="1.8" fill="#1a1015" />
      )}
    </svg>
  );
}
