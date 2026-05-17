'use client';

import { COLLECTIONS } from '../data';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Marquee() {
  const items = [...COLLECTIONS, ...COLLECTIONS];
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-black/30 backdrop-blur-sm">
      <div className="marquee-track flex gap-10 whitespace-nowrap py-2.5 font-mono text-sm">
        {items.map((c, i) => {
          const up = c.change24h >= 0;
          return (
            <div key={`${c.slug}-${i}`} className="flex items-center gap-2">
              <span className="text-sunset font-bold">{c.ticker}</span>
              <span className="text-cream/80">{c.floor.toFixed(2)} Ξ</span>
              <span className={`flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {up ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                {up ? '+' : ''}{c.change24h.toFixed(1)}%
              </span>
              <span className="text-white/20">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
