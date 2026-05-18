'use client';

import { useMemo, useState } from 'react';
import { ArrowUp, Sprout, Search, X } from 'lucide-react';
import { COLLECTIONS, type Collection } from '../data';
import Spark, { sparkline } from './Spark';
import TokenSheet from './TokenSheet';

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

export default function MarketsView({
  search, onSearch,
}: {
  search: string;
  onSearch: (s: string) => void;
}) {
  const [open, setOpen] = useState<Collection | null>(null);

  // Sort by 24h volume — pump.fun "top volume" default.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? COLLECTIONS.filter(c =>
          c.ticker.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q))
      : COLLECTIONS;
    return [...base].sort((a, b) => b.volume24h - a.volume24h);
  }, [search]);

  const movers = filtered.filter(c => c.change24h > 5).length;

  return (
    <div className="px-3 md:px-6 pt-3 pb-32 md:pb-12 max-w-3xl mx-auto">
      {/* SEARCH BAR — prominent, above the list */}
      <div className="relative mb-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search tickers, collections…"
          className="w-full bg-white/4 border border-white/8 hover:border-white/15 focus:border-pink-400/50 transition pl-11 pr-10 py-3 rounded-2xl outline-none text-sm font-mono placeholder:text-white/30"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* "N new movers" pill — pump.fun style */}
      <button className="w-full mt-1 mb-1 bg-white/4 border border-white/8 hover:border-up/40 rounded-2xl py-2.5 flex items-center justify-center gap-2 text-up font-display font-bold text-sm transition">
        <ArrowUp size={14}/> {movers} new mover{movers === 1 ? '' : 's'}
      </button>

      {/* TOKEN LIST — sorted by volume */}
      <div className="divide-y divide-white/5">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-white/40">No matches.</div>
        )}
        {filtered.map(c => (
          <Row key={c.slug} c={c} onTap={() => setOpen(c)} />
        ))}
      </div>

      {open && <TokenSheet c={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Row({ c, onTap }: { c: Collection; onTap: () => void }) {
  const up = c.change24h >= 0;
  const spark = sparkline(c.floor, c.change24h, 28);
  const hueA = (c.ticker.charCodeAt(0) * 23) % 360;
  const hueB = (c.ticker.charCodeAt(1) * 41) % 360;
  const mcUsd = c.floor * c.supply * ETH_USD;

  return (
    <button
      onClick={onTap}
      className="w-full grid grid-cols-[64px_minmax(0,1fr)_auto_auto] items-center gap-3 py-3 text-left active:bg-white/4 transition rounded-lg"
    >
      {/* Thumbnail */}
      <div
        className="w-14 h-14 rounded-2xl overflow-hidden relative flex items-center justify-center shrink-0"
        style={{ background: `linear-gradient(135deg, hsl(${hueA} 70% 45%), hsl(${hueB} 70% 55%))` }}
      >
        <span className="font-display font-black text-white text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
          {c.ticker.slice(0, 2)}
        </span>
        <span
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 0%, transparent 45%)' }}
        />
      </div>

      {/* Name + ticker + sprout + age */}
      <div className="min-w-0">
        <div className="font-display font-semibold text-white text-[16px] leading-tight truncate">
          {c.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[12px]">
          <span className="text-white/60 font-mono">{c.ticker}</span>
          <Sprout size={10} className="text-up/80" />
          <span className="text-white/45 font-mono">{fakeAge(c.slug)}</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="shrink-0">
        <Spark data={spark} up={up} w={72} h={36} strokeWidth={1.8} />
      </div>

      {/* Floor price + MC underneath */}
      <div className="text-right shrink-0 min-w-[72px]">
        <div className="font-display font-bold text-white text-[16px] leading-tight">
          {c.floor.toFixed(2)} <span className="text-sm opacity-85">Ξ</span>
        </div>
        <div className="text-[10px] text-white/40 font-mono mt-0.5">{fmtUsd(mcUsd)}</div>
      </div>
    </button>
  );
}
