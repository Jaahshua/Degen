'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import BloodshotLoader from './BloodshotLoader';

const DURATION_MS = 5200;

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
      else setTimeout(close, 380);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onDone, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-6 transition-opacity duration-400 ${
        closing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient projector lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 100% 0%, rgba(255,61,138,0.28) 0%, rgba(107,45,196,0.10) 30%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 40% at 0% 100%, rgba(107,45,196,0.16) 0%, transparent 55%)',
          }}
        />
        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
        {/* Drifting dust */}
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-white/40"
            style={{
              top:  `${((i * 47) + 11) % 100}%`,
              left: `${((i * 71) + 5)  % 100}%`,
              boxShadow: '0 0 6px rgba(255,243,214,0.55)',
              animation: `drift ${7 + (i % 5) * 1.5}s ease-in-out infinite`,
              animationDelay: `${(i * 0.22)}s`,
            }}
          />
        ))}
      </div>

      {/* Centered title */}
      <div className="relative flex flex-col items-center text-center">
        <h1 className="font-display font-black tracking-mega text-5xl md:text-7xl leading-none shadow-glow-pink">
          <span className="text-sunset">DEGEN</span><span className="text-white">SEA</span>
        </h1>
        <p className="mt-3 text-[10px] md:text-xs uppercase tracking-[0.5em] text-white/45 font-mono">
          Sunset NFT Terminal
        </p>

        {/* Loading bar of bloodshot eyes */}
        <div className="mt-10 md:mt-12">
          <BloodshotLoader progress={progress} />
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={close}
        className="absolute bottom-10 group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-400/45 transition text-[10px] uppercase tracking-[0.36em] font-mono"
      >
        Enter Terminal
        <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
