'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import BloodshotLoader from './BloodshotLoader';

const VIDEO_ID = '1bfS6C-EnfYh3Y_jmEzVs73BwBU2w9OZ6';
const VIDEO_URL = `https://drive.google.com/file/d/${VIDEO_ID}/preview`;
const DURATION_MS = 7500;

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
      else setTimeout(close, 350);
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
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-4 transition-opacity duration-300 ${
        closing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Projector vignette */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 100% 0%, rgba(255,122,155,0.25) 0%, rgba(91,44,142,0.10) 25%, transparent 55%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-5 select-none">
          <div className="font-display font-bold text-3xl tracking-tight leading-none">
            <span className="text-sunset">DEGEN</span><span className="text-white/95">SEA</span>
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.32em] text-white/45 font-mono">
            Sunset NFT Terminal
          </div>
        </div>

        {/* Video frame */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-[0_30px_80px_-20px_rgba(255,122,155,0.35)]">
          <iframe
            src={VIDEO_URL}
            title="Loading"
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          {/* corner glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
            }}
          />
        </div>

        {/* Bloodshot loader */}
        <div className="mt-7 flex justify-center">
          <BloodshotLoader progress={progress} />
        </div>

        {/* Skip / Enter */}
        <div className="mt-7 flex justify-center">
          <button
            onClick={close}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-400/40 transition text-xs uppercase tracking-[0.32em] font-mono"
          >
            Enter Terminal
            <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
