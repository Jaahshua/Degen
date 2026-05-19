'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sprout, Search as SearchIcon, X } from 'lucide-react';
import { COLLECTIONS, fetchOpenSeaCollection, type Collection } from '../data';
import Spark, { sparkline } from './Spark';
import TokenDetail from './TokenDetail';
import Thumb from './Thumb';

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
  const [live, setLive] = useState<Record<string, Collection>>({});

  // Pull live floor/volume/image for every collection on mount.
  useEffect(() => {
    let cancelled = false;
    Promise.all(COLLECTIONS.map(fetchOpenSeaCollection)).then(rows => {
      if (cancelled) return;
      const map: Record<string, Collection> = {};
      rows.forEach(r => { map[r.slug] = r; });
      setLive(map);
    });
    return () => { cancelled = true; };
  }, []);

  const merged = useMemo(
    () => COLLECTIONS.map(c => live[c.slug] ?? c),
    [live],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? merged.filter(c =>
          c.ticker.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q))
      : merged;
    return [...base].sort((a, b) => b.volume24h - a.volume24h);
  }, [merged, search]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: '#000',
          margin: '0 -12px',
          padding: '8px 12px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ position: 'relative' }}>
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
      </div>

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
      <Thumb collection={c} />

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

      <Spark data={spark} up={up} width={80} height={36} />

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
