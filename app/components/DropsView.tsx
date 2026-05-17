'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Clock, Users, Sparkles, ArrowUpRight } from 'lucide-react';
import { DROPS, formatCountdown, type Drop } from '../data';

function useNowTick() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return n;
}

function DropCover({ d, large = false }: { d: Drop; large?: boolean }) {
  return (
    <div
      className={`relative ${large ? 'aspect-[16/9]' : 'aspect-square'} rounded-2xl overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${d.hue1} 0%, ${d.hue2} 50%, ${d.hue3} 100%)` }}
    >
      <div className="absolute inset-0 opacity-50 mix-blend-overlay shimmer" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 0%, transparent 35%), radial-gradient(circle at 75% 70%, rgba(0,0,0,0.18) 0%, transparent 45%)',
        }}
      />
      <div className="absolute inset-0 flex items-end p-4">
        <div className="font-display font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] text-2xl leading-none">
          {d.ticker}
        </div>
      </div>
      {d.hot && (
        <div className="absolute top-3 left-3 bg-black/45 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] uppercase tracking-wider text-pink-200 flex items-center gap-1">
          <Flame size={10}/> Hot
        </div>
      )}
    </div>
  );
}

export default function DropsView({ search }: { search: string }) {
  useNowTick(); // re-render every second for countdowns
  const [baseTime] = useState(() => Math.floor(Date.now() / 1000));

  const filtered = useMemo<Drop[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DROPS;
    return DROPS.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.ticker.toLowerCase().includes(q) ||
      d.artist.toLowerCase().includes(q),
    );
  }, [search]);

  const now = Math.floor(Date.now() / 1000);

  const [featured, ...rest] = filtered;
  if (!featured) {
    return (
      <div className="pr-[60px]">
        <div className="card p-10 text-center text-white/40">No drops match that search.</div>
      </div>
    );
  }

  const featuredRemaining = Math.max(0, baseTime + featured.liveInSeconds - now);

  return (
    <div className="space-y-6 pr-[60px]">
      {/* FEATURED HERO */}
      <div className="card-glow paper-texture relative overflow-hidden p-6 md:p-8">
        <div className="absolute -top-40 -right-32 w-[420px] h-[420px] rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="grid md:grid-cols-2 gap-7 relative">
          <DropCover d={featured} large />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-pink-300/90 text-[11px] uppercase tracking-[0.22em] mb-2">
              <Sparkles size={13}/> Featured Drop
            </div>
            <div className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              {featured.name}
            </div>
            <div className="text-sunset text-lg mt-2 font-mono">${featured.ticker}</div>
            <div className="text-white/60 text-sm mt-1">by {featured.artist}</div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-white/50">Supply</div>
                <div className="font-mono text-lg mt-1">{featured.supply.toLocaleString()}</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-white/50">Mint</div>
                <div className="font-mono text-lg mt-1">{featured.priceEth} Ξ</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-white/50">Live In</div>
                <div className="font-mono text-lg mt-1 text-sunset">{formatCountdown(featuredRemaining)}</div>
              </div>
            </div>

            <button className="btn-sunset rounded-2xl mt-6 py-4 text-lg font-display tracking-tight pulse-glow flex items-center justify-center gap-2">
              {featuredRemaining === 0 ? 'MINT NOW' : 'SET REMINDER'} <ArrowUpRight size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl tracking-tight">Upcoming &amp; Trending</h2>
          <div className="text-xs text-white/40 font-mono">{filtered.length} drops</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map(d => {
            const remaining = Math.max(0, baseTime + d.liveInSeconds - now);
            return (
              <div key={d.id} className="card paper-texture relative overflow-hidden p-4 hover:border-pink-400/40 transition group">
                <DropCover d={d} />
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-bold text-lg truncate leading-tight">{d.name}</div>
                    <div className="text-xs text-white/55 truncate">by {d.artist}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm">{d.priceEth} Ξ</div>
                    <div className="text-[11px] text-white/50 flex items-center gap-1 justify-end mt-0.5">
                      <Users size={10}/> {d.supply.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-sunset font-mono">
                    <Clock size={12}/>
                    {remaining === 0 ? 'LIVE' : formatCountdown(remaining)}
                  </div>
                  <button className="btn-ghost rounded-lg px-3 py-1.5 text-xs font-display tracking-tight">
                    {remaining === 0 ? 'MINT' : 'REMIND'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
