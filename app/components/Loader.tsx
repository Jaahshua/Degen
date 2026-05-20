'use client';

import Eye, { type EyeState } from './Eye';

const N = 10;

function stateFor(progress: number, i: number): EyeState {
  const slotStart = i / N;
  // Normal eye lingers for ~75% of the slot before turning bloodshot.
  const slotFlip  = (i + 0.78) / N;
  if (progress <= slotStart) return 'closed';
  if (progress <= slotFlip)  return 'normal';
  return 'bloodshot';
}

export default function Loader({ progress }: { progress: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          position: 'relative',
          width: 320,
          height: 56,
          borderRadius: 999,
          background: 'rgba(0, 0, 0, 0.75)',
          border: '2px solid rgba(255, 255, 255, 0.12)',
          boxShadow:
            '0 8px 40px -10px rgba(220, 38, 38, 0.6), inset 0 0 24px rgba(220, 38, 38, 0.16)',
          overflow: 'hidden',
        }}
      >
        {/* Inner red glow that intensifies with progress */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.22), transparent 70%)',
            opacity: 0.25 + progress * 0.6,
            transition: 'opacity 300ms ease',
            pointerEvents: 'none',
          }}
        />

        {/* Eyes row */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
          }}
        >
          {Array.from({ length: N }).map((_, i) => (
            <Eye key={i} size={22} state={stateFor(progress, i)} />
          ))}
        </div>

        {/* Sunset progress underline */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 12,
            right: 12,
            height: 3,
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 999,
              width: `${Math.round(progress * 100)}%`,
              background: 'linear-gradient(90deg, #ff3d8a 0%, #ff7e5f 50%, #fbbf24 100%)',
              boxShadow: '0 0 10px rgba(255, 61, 138, 0.9)',
              transition: 'width 180ms ease-out',
            }}
          />
        </div>

        {/* Scan line sweep */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            width: 1,
            background:
              'linear-gradient(to bottom, transparent, rgba(255, 61, 138, 0.85), transparent)',
            boxShadow: '0 0 10px rgba(255, 61, 138, 0.85)',
            animation: 'scan-bar 2.6s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.55em',
          color: 'rgba(255, 255, 255, 0.55)',
          textTransform: 'uppercase',
          fontWeight: 700,
          fontFamily: 'var(--font-mono), monospace',
        }}
      >
        Opening The Eyes · {Math.round(progress * 100).toString().padStart(2, '0')}%
      </div>
    </div>
  );
}
