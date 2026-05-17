'use client';

import { useMemo, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { COLLECTIONS, type Collection } from '../data';
import Spark, { sparkline } from './Spark';
import MobileTokenSheet from './MobileTokenSheet';

const ETH_USD = 3000;

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fakeAge(slug: string) {
  let s = 0;
  for (let i = 0; i < slug.length; i++) s = (s * 31 + slug.charCodeAt(i)) | 0;
  const days = Math.abs(s) % 1500 + 5;
  if (days >= 365) return `${Math.floor(days / 365)}y`;
  if (days >= 30)  return `${Math.floor(days / 30)}mo`;
  return `${days}d`;
}

export default function MobileMarkets({ search }: { search: string }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COLLECTIONS;
    return COLLECTIONS.filter(c =>
      c.ticker.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q),
    );
  }, [search]);

  const [open, setOpen] = useState<Collection | null>(null);
  const movers = filtered.filter(c => c.change24h > 5).length;

  return (
    <div className="px-3 pt-3 pb-[120px]">
      <button className="w-full bg-white/4 border border-white/8 hover:border-up/40 rounded-2xl py-3 mb-2 flex items-center justify-center gap-2 text-up font-display font-bold text-sm transition">
        <ArrowUp size={15}/> {movers} new movers
      </button>

      <div className="divide-y divide-white/5">
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-white/40">No matches.</div>
        )}
        {filtered.map(c => (
          <TokenRow key={c.slug} c={c} onTap={() => setOpen(c)} />
        ))}
      </div>

      {open && <MobileTokenSheet c={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function TokenRow({ c, onTap }: { c: Collection; onTap: () => void }) {
  const up = c.change24h >= 0;
  const mcUsd = c.floor * c.supply * ETH_USD;
  const spark = sparkline(c.floor, c.change24h, 22);
  const hueA = (c.ticker.charCodeAt(0) * 23) % 360;
  const hueB = (c.ticker.charCodeAt(1) * 41) % 360;

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 py-3 active:bg-white/5 transition text-left"
    >
      <div
        className="w-14 h-14 rounded-xl shrink-0 relative overflow-hidden flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, hsl(${hueA} 70% 45%), hsl(${hueB} 70% 55%))` }}
      >
        <span className="text-white font-display font-bold text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
          {c.ticker.slice(0, 2)}
        </span>
        <span className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 0%, transparent 45%)',
        }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-display font-semibold text-white text-[15px] leading-tight truncate">
          {c.name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs">
          <span className="text-white/55">{c.ticker}</span>
          <Sparkles size={10} className="text-up" />
          <span className="text-white/45">{fakeAge(c.slug)}</span>
          <span className={`ml-1.5 font-mono ${up ? 'text-up' : 'text-down'}`}>
            {up ? '+' : ''}{c.change24h.toFixed(1)}%
          </span>
        </div>
      </div>

      <Spark data={spark} up={up} w={64} h={32} />

      <div className="text-right shrink-0 w-[70px]">
        <div className="font-display font-bold text-white text-[15px]">{fmtUsd(mcUsd)}</div>
      </div>
    </button>
  );
}
