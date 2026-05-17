'use client';

const N = 8;

export default function BloodshotLoader({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/65 border border-white/8 shadow-[0_0_50px_-10px_rgba(220,38,38,0.7)]">
          {Array.from({ length: N }).map((_, i) => (
            <Eye key={i} lit={progress >= (i + 1) / N} index={i} />
          ))}
        </div>

        {/* Scan line across the eyes */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
          <div
            className="absolute top-0 bottom-0 w-px scan"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(255,61,138,0.85), transparent)',
              boxShadow: '0 0 14px rgba(255,61,138,0.85)',
            }}
          />
        </div>
      </div>

      <div className="relative w-full max-w-xs h-[3px] rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300 transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(progress * 100)}%`, boxShadow: '0 0 12px rgba(255,61,138,0.85)' }}
        />
      </div>

      <div className="text-[10px] tracking-[0.5em] text-white/55 font-mono uppercase">
        Eyes Opening · {Math.round(progress * 100).toString().padStart(2, '0')}%
      </div>
    </div>
  );
}

function Eye({ lit, index }: { lit: boolean; index: number }) {
  // Deterministic gaze direction so each eye stares somewhere different.
  const seed = index * 137 + 23;
  const angle = (seed * 1.3) % 360;
  const r = 2.6;
  const dx = Math.cos((angle * Math.PI) / 180) * r;
  const dy = Math.sin((angle * Math.PI) / 180) * r * 0.55;
  const pupilSize = 3.2 + ((seed * 7) % 5) * 0.25;

  return (
    <div
      className={lit ? 'eye-twitch' : ''}
      style={{ animationDelay: `${index * 0.31}s` }}
    >
      <div
        className={lit ? 'eye-blink' : ''}
        style={{ animationDelay: `${index * 0.7 + 1.2}s` }}
      >
        <svg
          viewBox="0 0 60 60"
          className="w-9 h-9 transition-all duration-500"
          style={{
            opacity: lit ? 1 : 0.32,
            transform: lit ? 'scale(1)' : 'scale(0.72)',
            filter: lit
              ? 'drop-shadow(0 0 8px rgba(220,38,38,0.7)) drop-shadow(0 0 16px rgba(255,61,138,0.35))'
              : 'none',
          }}
        >
          {lit ? (
            <g>
              {/* Outer eye socket shadow */}
              <ellipse cx="30" cy="30" rx="28" ry="22" fill="#1a0506" opacity="0.5" />

              {/* Sclera — almond shape */}
              <path
                d="M 3 30 Q 30 6 57 30 Q 30 54 3 30 Z"
                fill="#fef4e0"
              />

              {/* Sclera shading */}
              <path
                d="M 3 30 Q 30 6 57 30 Q 30 54 3 30 Z"
                fill="url(#scleraShade)"
                opacity="0.4"
              />
              <defs>
                <radialGradient id="scleraShade" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#fef4e0" />
                  <stop offset="100%" stopColor="#e0c2a0" />
                </radialGradient>
              </defs>

              {/* Veins — left side */}
              <path d="M 4 27 Q 14 22 25 28" stroke="#dc2626" fill="none" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M 3 32 Q 14 32 24 30" stroke="#991b1b" fill="none" strokeWidth="1.1" strokeLinecap="round" />
              <path d="M 5 36 Q 14 38 24 35" stroke="#b91c1c" fill="none" strokeWidth="1"   strokeLinecap="round" />
              <path d="M 7 24 Q 16 21 22 26" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
              <path d="M 7 40 Q 14 42 23 38" stroke="#7f1d1d" fill="none" strokeWidth="0.9" strokeLinecap="round" />

              {/* Veins — right side */}
              <path d="M 56 27 Q 46 22 35 28" stroke="#dc2626" fill="none" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M 57 32 Q 46 32 36 30" stroke="#991b1b" fill="none" strokeWidth="1.1" strokeLinecap="round" />
              <path d="M 55 36 Q 46 38 36 35" stroke="#b91c1c" fill="none" strokeWidth="1"   strokeLinecap="round" />
              <path d="M 53 24 Q 44 21 38 26" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
              <path d="M 53 40 Q 46 42 37 38" stroke="#7f1d1d" fill="none" strokeWidth="0.9" strokeLinecap="round" />

              {/* Veins — top/bottom */}
              <path d="M 30 9  Q 32 18 30 25" stroke="#991b1b" fill="none" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M 30 51 Q 28 42 30 35" stroke="#991b1b" fill="none" strokeWidth="0.8" strokeLinecap="round" />

              {/* Iris — layered rings for depth */}
              <circle cx={30 + dx} cy={30 + dy} r="10.5" fill="#1a0a0a" />
              <circle cx={30 + dx} cy={30 + dy} r="10"   fill="#3a1810" />
              <circle cx={30 + dx} cy={30 + dy} r="8.2"  fill="#5b1f12" />
              <circle cx={30 + dx} cy={30 + dy} r="6.5"  fill="#7a2418" />
              <circle cx={30 + dx} cy={30 + dy} r="4.8"  fill="#3a1208" />

              {/* Iris detail — radial streaks */}
              {Array.from({ length: 8 }).map((_, k) => {
                const a = (k * Math.PI * 2) / 8;
                return (
                  <line
                    key={k}
                    x1={30 + dx + Math.cos(a) * 4.8}
                    y1={30 + dy + Math.sin(a) * 4.8}
                    x2={30 + dx + Math.cos(a) * 8}
                    y2={30 + dy + Math.sin(a) * 8}
                    stroke="#2a0a05"
                    strokeWidth="0.5"
                    opacity="0.7"
                  />
                );
              })}

              {/* Pupil */}
              <circle cx={30 + dx} cy={30 + dy} r={pupilSize} fill="#000" />

              {/* Highlight */}
              <ellipse cx={28 + dx} cy={27 + dy} rx="1.6" ry="1.2" fill="#fff" opacity="0.92" />
              <circle cx={32 + dx} cy={28 + dy} r="0.6" fill="#fff" opacity="0.5" />

              {/* Lower lid shadow */}
              <path
                d="M 3 30 Q 30 50 57 30 Q 30 58 3 30 Z"
                fill="rgba(60,15,15,0.35)"
              />
            </g>
          ) : (
            // Closed eye — dark slit
            <g>
              <ellipse cx="30" cy="32" rx="24" ry="2.2" fill="#1a0a0f" />
              <ellipse cx="30" cy="31" rx="22" ry="0.8" fill="#3a1a25" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
