'use client';

import { COLLECTIONS } from '../data';

export default function Marquee() {
  const items = [...COLLECTIONS, ...COLLECTIONS];
  return (
    <div className="relative overflow-hidden border-b border-white/5 bg-black/60 backdrop-blur-sm">
      <div className="marquee-track flex gap-8 whitespace-nowrap py-1.5 font-mono text-[11px]">
        {items.map((c, i) => {
          const up = c.change24h >= 0;
          return (
            <div key={`${c.slug}-${i}`} className="flex items-center gap-2">
              <span className="text-white/40">$</span>
              <span className="text-white font-bold tracking-wider">{c.ticker}</span>
              <span className="text-white/70">{c.floor.toFixed(2)}Ξ</span>
              <span className={up ? 'text-up' : 'text-down'}>
                {up ? '+' : ''}{c.change24h.toFixed(1)}%
              </span>
              <span className="text-white/15">·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
