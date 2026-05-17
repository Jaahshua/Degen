'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Clock, Users, Sparkles, ArrowUpRight, Bell, Zap } from 'lucide-react';
import { DROPS, formatCountdown, type Drop } from '../data';

function useTick() {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN(x => x + 1), 1000); return () => clearInterval(t); }, []);
  return n;
}

function DropCover({ d, big = false }: { d: Drop; big?: boolean }) {
  return (
    <div
      className={`relative ${big ? 'aspect-[16/10]' : 'aspect-square'} rounded-2xl overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${d.hue1} 0%, ${d.hue2} 50%, ${d.hue3} 100%)` }}
    >
      <div className="absolute inset-0 overflow-hidden flex items-center justify-end pointer-events-none">
        <span
          className={`font-display font-black tracking-mega text-white/15 leading-none select-none ${big ? 'text-[180px] md:text-[280px]' : 'text-[140px]'} -mr-4 translate-y-3`}
        >
          {d.ticker.slice(0, 6)}
        </span>
      </div>
      <div className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.22) 0%, transparent 50%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.30) 0%, transparent 50%)',
        }}
      />
      {d.hot && (
        <div className="absolute top-3 left-3 tag tag-hot bg-black/40 backdrop-blur-sm">
          <Flame size={9}/> Hot
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
        <div className="font-display font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] text-2xl md:text-3xl leading-none tracking-tight">
          ${d.ticker}
        </div>
      </div>
    </div>
  );
}

export default function DropsView({ search }: { search: string }) {
  useTick();
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
      <div className="px-3 md:px-6 pt-4 pb-32 max-w-7xl mx-auto">
        <div className="card p-10 text-center text-white/40 text-sm">No drops match.</div>
      </div>
    );
  }

  const featRemaining = Math.max(0, baseTime + featured.liveInSeconds - now);

  return (
    <div className="px-3 md:px-6 pt-4 pb-32 md:pb-16 max-w-7xl mx-auto space-y-7">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <h1 className="font-display font-black tracking-mega text-3xl md:text-4xl">
          <span className="text-sunset">Sunset</span> Drops
        </h1>
        <span className="text-[11px] text-white/40 font-mono">{filtered.length} drops</span>
      </div>

      {/* FEATURED */}
      <div
        className="relative rounded-3xl overflow-hidden p-5 md:p-7"
        style={{ background: `linear-gradient(135deg, ${featured.hue1}cc 0%, ${featured.hue2}b3 50%, ${featured.hue3}cc 100%)` }}
      >
        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/35" />
        <div className="relative grid md:grid-cols-[1.05fr_1fr] gap-6 items-center">
          <DropCover d={featured} big />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] font-mono uppercase tracking-[0.18em] text-white">
                <Sparkles size={11}/> Featured Drop
              </span>
              {featured.hot && (
                <span className="tag tag-hot bg-black/30 backdrop-blur"><Flame size={9}/>Hot</span>
              )}
            </div>
            <h2 className="font-display font-black text-white text-3xl md:text-5xl tracking-mega leading-none">
              {featured.name}
            </h2>
            <div className="text-sunset font-mono text-base mt-2.5">${featured.ticker}</div>
            <div className="text-white/65 text-sm mt-0.5">by {featured.artist}</div>

            <div className="grid grid-cols-3 gap-2.5 mt-5">
              <Box label="Supply" value={featured.supply.toLocaleString()} />
              <Box label="Mint"   value={`${featured.priceEth} Ξ`} />
              <Box label="Live in" value={formatCountdown(featRemaining)} highlight />
            </div>

            <button className="btn-sunset rounded-2xl mt-5 px-5 py-3.5 text-sm font-display font-black tracking-wider uppercase pulse-glow flex items-center justify-center gap-2 w-full md:w-auto">
              {featRemaining === 0 ? <>Mint Now <ArrowUpRight size={14}/></> : <>Remind Me <Bell size={13}/></>}
            </button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <h2 className="flex items-center gap-2 font-display font-black text-xl md:text-2xl tracking-mega">
            <Zap size={16} className="text-sunset"/>
            Upcoming
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {rest.map(d => {
            const remaining = Math.max(0, baseTime + d.liveInSeconds - now);
            return (
              <div key={d.id} className="card overflow-hidden p-3 hover:border-pink-400/40 transition">
                <DropCover d={d} />
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm truncate leading-tight">{d.name}</div>
                    <div className="text-[11px] text-white/50 truncate">by {d.artist}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold">{d.priceEth} Ξ</div>
                    <div className="text-[10px] text-white/45 flex items-center gap-0.5 justify-end mt-0.5">
                      <Users size={9}/>{d.supply.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sunset font-mono text-xs">
                    <Clock size={11}/>
                    {remaining === 0 ? 'LIVE' : formatCountdown(remaining)}
                  </div>
                  <button className="btn-ghost rounded-lg px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider">
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
    <div className="rounded-xl bg-black/35 backdrop-blur border border-white/10 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-widest text-white/55 font-mono">{label}</div>
      <div className={`font-mono text-sm mt-0.5 font-bold ${highlight ? 'text-sunset' : 'text-white'}`}>{value}</div>
    </div>
  );
}
