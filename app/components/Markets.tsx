'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sprout } from 'lucide-react';
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
  const [open, setOpen] = useState<Collection | null>(null);
  const [live, setLive] = useState<Record<string, Collection>>({});

  // Live-pull every curated collection on mount.
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

  const sorted = useMemo(() => {
    const merged = COLLECTIONS.map(c => live[c.slug] ?? c);
    return [...merged].sort((a, b) => b.volume24h - a.volume24h);
  }, [live]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      <div>
        {sorted.map(c => <Row key={c.slug} c={c} onTap={() => setOpen(c)} />)}
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
