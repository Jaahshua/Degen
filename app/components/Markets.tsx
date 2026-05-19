'use client';

import { useMemo, useState } from 'react';
import { Sprout, Search as SearchIcon, X } from 'lucide-react';
import { COLLECTIONS, type Collection } from '../data';
import Spark, { sparkline } from './Spark';
import TokenDetail from './TokenDetail';

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

export default function Markets() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Collection | null>(null);

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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <SearchIcon
          size={16}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tickers, collections…"
          style={{
            width: '100%',
            padding: '12px 40px 12px 40px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            fontSize: 14,
            fontFamily: 'var(--font-mono), monospace',
            outline: 'none',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* List */}
      <div>
        {filtered.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            No matches.
          </div>
        )}
        {filtered.map(c => <Row key={c.slug} c={c} onTap={() => setOpen(c)} />)}
      </div>

      {open && <TokenDetail c={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Row({ c, onTap }: { c: Collection; onTap: () => void }) {
  const up = c.change24h >= 0;
  const spark = sparkline(c.floor, c.change24h, 26);
  const hueA = (c.ticker.charCodeAt(0) * 23) % 360;
  const hueB = (c.ticker.charCodeAt(1) * 41) % 360;
  const mcUsd = c.floor * c.supply * ETH_USD;

  return (
    <button
      onClick={onTap}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '56px 1fr 80px 80px',
        gap: 12,
        alignItems: 'center',
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: `linear-gradient(135deg, hsl(${hueA} 70% 45%), hsl(${hueB} 70% 55%))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 0%, transparent 45%)',
          }}
        />
        <span
          style={{
            position: 'relative',
            color: '#fff',
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 6px rgba(0,0,0,0.55)',
          }}
        >
          {c.ticker.slice(0, 2)}
        </span>
      </div>

      {/* Name + ticker + age */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {c.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono), monospace' }}>
            {c.ticker}
          </span>
          <Sprout size={10} style={{ color: 'rgba(34,197,94,0.8)' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono), monospace' }}>
            {fakeAge(c.slug)}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <Spark data={spark} up={up} width={80} height={36} />

      {/* Floor + MC */}
      <div style={{ textAlign: 'right', minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {c.floor.toFixed(2)} <span style={{ fontSize: 13, opacity: 0.85 }}>Ξ</span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-mono), monospace',
            marginTop: 2,
          }}
        >
          {fmtUsd(mcUsd)}
        </div>
      </div>
    </button>
  );
}
