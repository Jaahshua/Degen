'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import BloodshotLoader from './BloodshotLoader';

const VIDEO_ID = '1bfS6C-EnfYh3Y_jmEzVs73BwBU2w9OZ6';
const VIDEO_URL = `https://drive.google.com/file/d/${VIDEO_ID}/preview`;
const DURATION_MS = 8000;

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
    setTimeout(onDone, 420);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-4 transition-opacity duration-400 ${
        closing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Projector ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 100% 0%, rgba(255,61,138,0.32) 0%, rgba(107,45,196,0.12) 28%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 35% at 0% 100%, rgba(107,45,196,0.18) 0%, transparent 50%)',
          }}
        />

        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        {/* Floating dust particles */}
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-white/40"
            style={{
              top: `${((i * 47) + 11) % 100}%`,
              left: `${((i * 71) + 5) % 100}%`,
              boxShadow: '0 0 6px rgba(255,243,214,0.55)',
              animation: `drift ${7 + (i % 5) * 1.5}s ease-in-out infinite`,
              animationDelay: `${(i * 0.2)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-5 select-none">
          <div className="font-display font-black text-4xl tracking-mega leading-none shadow-glow-pink">
            <span className="text-sunset">DEGEN</span><span className="text-white/95">SEA</span>
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.4em] text-white/45 font-mono">
            Sunset NFT Terminal · Loading
          </div>
        </div>

        {/* Video frame — vintage projector screen */}
        <div className="relative w-full aspect-video rounded-2xl">
          {/* Glow halo */}
          <div
            className="pointer-events-none absolute -inset-3 rounded-3xl opacity-80 blur-2xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(107,45,196,0.6) 0%, rgba(214,51,132,0.7) 50%, rgba(251,191,36,0.55) 100%)',
            }}
          />

          {/* Frame */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black border border-white/12 shadow-[inset_0_0_40px_rgba(0,0,0,0.6),0_40px_80px_-20px_rgba(255,61,138,0.4)]">
            <iframe
              src={VIDEO_URL}
              title="Loading"
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            {/* Vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55)' }}
            />
            {/* Scan lines */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 3px)',
              }}
            />
          </div>
        </div>

        {/* Loader */}
        <div className="mt-8">
          <BloodshotLoader progress={progress} />
        </div>

        {/* Skip */}
        <button
          onClick={close}
          className="group mt-7 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-400/50 transition text-[11px] uppercase tracking-[0.36em] font-mono"
        >
          Enter Terminal
          <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
