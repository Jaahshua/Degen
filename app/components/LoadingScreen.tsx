'use client';

import { useEffect, useState } from 'react';
import Loader from './Loader';
import Logo from './Logo';

const DURATION_MS = 4800;

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION_MS);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(close, 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onDone, 380);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        opacity: closing ? 0 : 1,
        pointerEvents: closing ? 'none' : 'auto',
        transition: 'opacity 360ms ease',
      }}
    >
      {/* Ambient sunset glow in upper right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 45% at 100% 0%, rgba(255,61,138,0.25) 0%, rgba(107,45,196,0.10) 30%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Drifting dust particles */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: `${((i * 47) + 11) % 100}%`,
              left: `${((i * 71) + 5) % 100}%`,
              width: 2,
              height: 2,
              borderRadius: 999,
              background: 'rgba(255,243,214,0.45)',
              boxShadow: '0 0 6px rgba(255,243,214,0.55)',
              animation: `drift ${7 + (i % 5) * 1.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.22}s`,
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Logo height={96} />
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            letterSpacing: '0.5em',
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono), monospace',
          }}
        >
          Sunset NFT Terminal
        </div>

        <div style={{ marginTop: 48 }}>
          <Loader progress={progress} />
        </div>
      </div>

      <button
        onClick={close}
        style={{
          position: 'absolute',
          bottom: 40,
          padding: '10px 20px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.65)',
          fontSize: 10,
          letterSpacing: '0.36em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono), monospace',
          cursor: 'pointer',
        }}
      >
        Enter Terminal →
      </button>
    </div>
  );
}
