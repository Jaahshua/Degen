'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Flame } from 'lucide-react';
import { COLLECTIONS, shortAddr, makeAddr } from '../data';
import { tokenPalette } from './TokenCard';

type T = { id: number; ticker: string; name: string; eth: number; buyer: string; hue1: string; hue2: string };

function pick(seed: number): T {
  const c = COLLECTIONS[seed % COLLECTIONS.length];
  const eth = +(c.floor * (0.6 + ((seed * 11) % 100) / 100 * 2.5)).toFixed(2);
  const [h1, h2] = tokenPalette(c.ticker);
  return { id: seed, ticker: c.ticker, name: c.name, eth, buyer: makeAddr(seed * 7919), hue1: h1, hue2: h2 };
}

export default function LiveTradeBubble() {
  const [t, setT] = useState<T | null>(null);

  useEffect(() => {
    let i = Math.floor(Math.random() * 1000);
    const show = () => {
      i++;
      setT(pick(i));
      setTimeout(() => setT(null), 4200);
    };
    const start = setTimeout(show, 2000);
    const tk = setInterval(show, 7000);
    return () => { clearTimeout(start); clearInterval(tk); };
  }, []);

  if (!t) return null;

  return (
    <div
      key={t.id}
      className="fixed top-20 right-4 z-30 max-w-[280px] fade-in hidden md:block"
    >
      <div
        className="flex items-center gap-3 pr-4 pl-2 py-2 rounded-2xl border border-white/10 backdrop-blur-md"
        style={{ background: `linear-gradient(135deg, ${t.hue1}cc 0%, ${t.hue2}cc 100%)` }}
      >
        <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center shrink-0">
          <Flame size={16} className="text-amber-200" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-white/80 font-mono">
            {shortAddr(t.buyer)} <span className="text-emerald-200 font-bold">bought</span>
          </div>
          <div className="flex items-center gap-1.5 text-white font-display font-bold text-sm">
            ${t.ticker} <span className="text-white/70 text-xs font-mono">{t.eth} Ξ</span>
            <ArrowUpRight size={12} className="text-emerald-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
