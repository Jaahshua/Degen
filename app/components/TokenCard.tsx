'use client';

import Spark, { sparkline } from './Spark';
import type { Collection } from '../data';

const ETH_USD = 3000;

export function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const PALETTES: [string, string, string][] = [
  ['#6b2dc4', '#d63384', '#ff7e5f'],
  ['#1f1a5e', '#d63384', '#fbbf24'],
  ['#d63384', '#ff3d8a', '#fbbf24'],
  ['#ff7e5f', '#ff3d8a', '#fbbf24'],
  ['#1f1a5e', '#6b2dc4', '#ff3d8a'],
  ['#6b2dc4', '#ff3d8a', '#fbbf24'],
  ['#ff3d8a', '#ff7e5f', '#fbbf24'],
  ['#1f1a5e', '#d63384', '#ff7e5f'],
];

export function tokenPalette(ticker: string): [string, string, string] {
  let s = 0;
  for (let i = 0; i < ticker.length; i++) s = (s * 31 + ticker.charCodeAt(i)) >>> 0;
  return PALETTES[s % PALETTES.length];
}

/**
 * Big square-ish card for grids (markets / launchpad). The ticker is the art —
 * it's blown up as a low-opacity watermark behind the data.
 */
export default function TokenCard({
  c, onTap, size = 'md',
}: {
  c: Collection;
  onTap?: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const up = c.change24h >= 0;
  const mcUsd = c.floor * c.supply * ETH_USD;
  const spark = sparkline(c.floor, c.change24h, 22);
  const [h1, h2, h3] = tokenPalette(c.ticker);

  const heights = { sm: 'aspect-[4/3]', md: 'aspect-[4/5]', lg: 'aspect-[4/5]' };
  const watermark = { sm: 'text-[88px]', md: 'text-[140px]', lg: 'text-[200px]' };

  return (
    <button
      onClick={onTap}
      className={`token-card ${heights[size]} w-full block text-left`}
      style={{
        background: `linear-gradient(135deg, ${h1} 0%, ${h2} 55%, ${h3} 100%)`,
        boxShadow: `0 16px 40px -16px ${h2}80`,
      }}
    >
      {/* Watermark ticker — the art */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-end z-0">
        <span
          className={`font-display font-black leading-none tracking-mega text-white/12 ${watermark[size]} -mr-2 translate-y-2 select-none`}
          style={{ textShadow: '0 2px 24px rgba(0,0,0,0.25)' }}
        >
          {c.ticker.slice(0, 6)}
        </span>
      </div>

      {/* Top row — ticker pill + live */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-white/95">
          ${c.ticker}
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[10px] font-mono uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-up pulse-dot" />
          <span className="text-white/85">Live</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-12 z-10 opacity-90 mix-blend-screen">
        <FillSpark data={spark} />
      </div>

      {/* Bottom data block */}
      <div className="absolute left-0 right-0 bottom-0 p-4 z-10">
        <div className="font-display font-bold text-white text-base md:text-lg truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
          {c.name}
        </div>
        <div className="flex items-baseline justify-between mt-1.5 gap-2">
          <div>
            <div className="font-mono text-2xl font-black text-white tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {c.floor.toFixed(2)}<span className="text-base ml-0.5 opacity-85">Ξ</span>
            </div>
            <div className="text-[10px] font-mono text-white/65 mt-1">MC {fmtUsd(mcUsd)}</div>
          </div>
          <div className={`text-right shrink-0 px-2 py-1 rounded-md text-xs font-mono font-bold ${
            up ? 'bg-emerald-500/30 text-emerald-100' : 'bg-rose-500/30 text-rose-100'
          }`}>
            {up ? '+' : ''}{c.change24h.toFixed(1)}%
          </div>
        </div>
      </div>
    </button>
  );
}

function FillSpark({ data }: { data: number[] }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 80 - 10;
    return [x, y] as const;
  });
  const linePath = pts.map(p => p.join(',')).join(' ');
  const fillPath = `M ${pts.map(p => p.join(',')).join(' L ')} L 100,100 L 0,100 Z`;
  const last = pts[pts.length - 1];

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id="cardSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#cardSparkFill)" />
      <polyline
        points={linePath}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.55))' }}
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#fff" opacity="0.4" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="1.5" fill="#fff" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
