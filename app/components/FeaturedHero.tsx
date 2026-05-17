'use client';

import { Flame, ArrowUpRight, ArrowDownRight, TrendingUp, Users, Boxes } from 'lucide-react';
import Spark, { sparkline } from './Spark';
import { fmtUsd, tokenPalette } from './TokenCard';
import type { Collection } from '../data';

const ETH_USD = 3000;

export default function FeaturedHero({ c, onBuy }: { c: Collection; onBuy: () => void }) {
  const up = c.change24h >= 0;
  const mcUsd = c.floor * c.supply * ETH_USD;
  const spark = sparkline(c.floor, c.change24h, 36);
  const [h1, h2, h3] = tokenPalette(c.ticker);

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-5 md:p-7"
      style={{
        background: `linear-gradient(135deg, ${h1} 0%, ${h2} 45%, ${h3} 100%)`,
        boxShadow: `0 30px 80px -20px ${h2}80`,
      }}
    >
      {/* Sheen */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.22) 0%, transparent 45%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.25) 0%, transparent 50%)',
        }}
      />

      {/* Massive watermark */}
      <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-end pointer-events-none">
        <span
          className="font-display font-black tracking-mega text-white/12 leading-none select-none text-[160px] md:text-[280px] -mr-4 md:-mr-8"
          style={{ textShadow: '0 6px 30px rgba(0,0,0,0.2)' }}
        >
          {c.ticker.slice(0, 6)}
        </span>
      </div>

      <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur text-[10px] font-mono uppercase tracking-[0.18em] text-white">
              <Flame size={11} className="text-amber-200" /> #1 Trending
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur text-[10px] font-mono uppercase tracking-[0.18em]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-white/95">Live</span>
            </span>
          </div>

          <div className="font-display font-bold text-white/85 text-sm uppercase tracking-[0.18em]">
            ${c.ticker}
          </div>
          <h1 className="font-display font-black tracking-mega text-white text-4xl md:text-6xl leading-[0.95] mt-1 drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            {c.name}
          </h1>

          <div className="flex items-end gap-3 mt-5">
            <div className="font-mono font-black text-white tracking-tight text-5xl md:text-7xl leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              {c.floor.toFixed(2)}<span className="text-3xl md:text-4xl ml-1 opacity-85">Ξ</span>
            </div>
            <div className={`mb-2 px-2.5 py-1 rounded-md text-sm font-mono font-bold flex items-center gap-0.5 ${
              up ? 'bg-emerald-500/35 text-emerald-50' : 'bg-rose-500/35 text-rose-50'
            }`}>
              {up ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
              {up ? '+' : ''}{c.change24h.toFixed(2)}%
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-6">
            <Stat label="MC" value={fmtUsd(mcUsd)} icon={<TrendingUp size={11}/>} />
            <Stat label="Vol 24H" value={`${c.volume24h.toLocaleString()} Ξ`} icon={<Flame size={11}/>} />
            <Stat label="Holders" value={c.owners.toLocaleString()} icon={<Users size={11}/>} />
            <Stat label="Supply" value={c.supply.toLocaleString()} icon={<Boxes size={11}/>} className="hidden md:block" />
          </div>

          {/* CTAs */}
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={onBuy}
              className="flex-1 rounded-xl bg-white text-black px-5 py-3.5 font-display font-black text-base tracking-wider uppercase hover:scale-[1.02] active:scale-[0.99] transition shadow-[0_10px_28px_-10px_rgba(255,255,255,0.45)]"
            >
              Buy ${c.ticker}
            </button>
            <button className="rounded-xl px-5 py-3.5 font-display font-bold text-sm tracking-wider uppercase bg-black/30 backdrop-blur border border-white/15 hover:bg-black/40 transition text-white">
              Sweep
            </button>
          </div>
        </div>

        {/* Chart panel */}
        <div className="md:w-[280px] md:h-[260px] bg-black/30 backdrop-blur border border-white/10 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/70 font-mono">Floor · 24H</span>
            <span className={`text-[10px] font-mono ${up ? 'text-emerald-200' : 'text-rose-200'}`}>
              {up ? '↑' : '↓'} {Math.abs(c.change24h).toFixed(1)}%
            </span>
          </div>
          <div className="flex-1 min-h-[140px]">
            <Spark data={spark} up={up} w={260} h={150} strokeWidth={2.2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, className = '' }: {
  label: string; value: string; icon: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-black/30 backdrop-blur border border-white/10 rounded-xl px-3 py-2 ${className}`}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-white/65 font-mono">
        {icon} {label}
      </div>
      <div className="font-mono text-sm font-bold text-white mt-1">{value}</div>
    </div>
  );
}
