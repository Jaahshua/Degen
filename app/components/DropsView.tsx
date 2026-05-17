'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Clock, Users, Sparkles, ArrowUpRight, Bell } from 'lucide-react';
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
      className={`relative ${large ? 'aspect-[16/10]' : 'aspect-square'} rounded-lg overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${d.hue1} 0%, ${d.hue2} 55%, ${d.hue3} 100%)` }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.22) 0%, transparent 35%), radial-gradient(circle at 75% 70%, rgba(0,0,0,0.22) 0%, transparent 45%)',
        }}
      />
      <div className="absolute inset-0 flex items-end p-3">
        <div className="font-display font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] text-xl leading-none">
          ${d.ticker}
        </div>
      </div>
      {d.hot && (
        <div className="absolute top-2 left-2 tag tag-hot">
          <Flame size={9}/> HOT
        </div>
      )}
    </div>
  );
}

export default function DropsView({ search }: { search: string }) {
  useNowTick();
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
      <div className="px-3 pt-3">
        <div className="term-panel p-10 text-center text-white/40 text-sm">No drops match that search.</div>
      </div>
    );
  }

  const featuredRemaining = Math.max(0, baseTime + featured.liveInSeconds - now);

  return (
    <div className="px-3 pt-3 space-y-4">
      {/* FEATURED */}
      <div className="term-panel relative overflow-hidden">
        <div className="absolute -top-32 -right-20 w-[380px] h-[380px] rounded-full bg-pink-500/15 blur-3xl pointer-events-none" />
        <div className="term-panel-header">
          <span className="flex items-center gap-1.5"><Sparkles size={11}/> Featured Drop</span>
          <span className="tag tag-hot"><Flame size={9}/>HOT</span>
        </div>
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-5 p-4">
          <DropCover d={featured} large />
          <div className="flex flex-col">
            <div className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {featured.name}
            </div>
            <div className="text-sunset font-mono text-base mt-2">${featured.ticker}</div>
            <div className="text-white/45 text-xs mt-1">by {featured.artist}</div>

            <div className="grid grid-cols-3 gap-2 mt-5">
              <Box label="Supply" value={featured.supply.toLocaleString()} />
              <Box label="Mint" value={`${featured.priceEth} Ξ`} />
              <Box label="Live in" value={formatCountdown(featuredRemaining)} highlight />
            </div>

            <button className="btn-sunset rounded-lg mt-5 py-3 text-sm font-display tracking-wider uppercase pulse-glow flex items-center justify-center gap-2">
              {featuredRemaining === 0 ? <>Mint Now <ArrowUpRight size={14}/></> : <>Set Reminder <Bell size={13}/></>}
            </button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="term-panel">
        <div className="term-panel-header">
          <span>Upcoming &amp; Trending</span>
          <span className="text-[10px] text-white/30 font-mono">{filtered.length} drops</span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {rest.map(d => {
            const remaining = Math.max(0, baseTime + d.liveInSeconds - now);
            return (
              <div key={d.id} className="bg-black/40 border border-white/5 hover:border-pink-400/30 transition rounded-lg p-2.5 group">
                <DropCover d={d} />
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm truncate leading-tight">{d.name}</div>
                    <div className="text-[11px] text-white/45 truncate">by {d.artist}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs">{d.priceEth} Ξ</div>
                    <div className="text-[10px] text-white/40 flex items-center gap-0.5 justify-end mt-0.5">
                      <Users size={9}/> {d.supply.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-sunset font-mono">
                    <Clock size={10}/>
                    {remaining === 0 ? 'LIVE' : formatCountdown(remaining)}
                  </div>
                  <button className="btn-ghost rounded-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider">
                    {remaining === 0 ? 'Mint' : 'Remind'}
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

function Box({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md bg-black/40 border border-white/5 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-widest text-white/45">{label}</div>
      <div className={`font-mono text-sm mt-0.5 ${highlight ? 'text-sunset' : ''}`}>{value}</div>
    </div>
  );
}
