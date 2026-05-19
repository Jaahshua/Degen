'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sprout } from 'lucide-react';
import {
  RECENT_TRENDING, fetchTrendingCollection, type Trending,
  type Collection,
} from '../data';
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

function fmtAge(days: number) {
  if (days >= 365) return `${(days / 365).toFixed(days >= 730 ? 0 : 1)}y`;
  if (days >= 30)  return `${Math.floor(days / 30)}mo`;
  return `${days}d`;
}

export default function Drops() {
  const [items, setItems] = useState<Trending[] | null>(null);
  const [open, setOpen] = useState<Collection | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(RECENT_TRENDING.map(fetchTrendingCollection))
      .then(rows => {
        if (cancelled) return;
        const sorted = [...rows].sort((a, b) => b.volume24h - a.volume24h);
        setItems(sorted);
      })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  const liveCount = useMemo(() => items?.filter(i => i.live).length ?? 0, [items]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      <div style={{ marginBottom: 12 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          <span className="text-sunset">Recent</span> Drops
        </h1>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-mono), monospace',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          New collections in top OpenSea volume
          {items && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: liveCount > 0 ? 'var(--up)' : 'rgba(255,255,255,0.4)' }}>
                {liveCount > 0 ? `${liveCount} LIVE` : 'CACHED'}
              </span>
            </>
          )}
        </div>
      </div>

      {!items && <Skeleton />}

      {items && items.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          OpenSea didn't return data right now. Try refreshing in a minute.
        </div>
      )}

      {items && items.length > 0 && (
        <div>
          {items.map(item => (
            <Row
              key={item.slug}
              item={item}
              onTap={() =>
                setOpen({
                  slug: item.slug,
                  ticker: item.ticker,
                  name: item.name,
                  floor: item.floor,
                  change24h: item.change24h,
                  volume24h: item.volume24h,
                  owners: item.owners,
                  supply: item.supply,
                  imageUrl: item.imageUrl,
                })
              }
            />
          ))}
        </div>
      )}

      {open && <TokenDetail c={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Row({ item, onTap }: { item: Trending; onTap: () => void }) {
  const up = item.change24h >= 0;
  const spark = sparkline(item.floor, item.change24h, 26);
  const mcUsd = item.floor * item.supply * ETH_USD;

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
      <Thumb collection={{
        slug: item.slug,
        ticker: item.ticker,
        name: item.name,
        floor: item.floor,
        change24h: item.change24h,
        volume24h: item.volume24h,
        owners: item.owners,
        supply: item.supply,
        imageUrl: item.imageUrl,
      }} />

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
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono), monospace' }}>
            {item.ticker}
          </span>
          <Sprout size={10} style={{ color: 'rgba(34,197,94,0.8)' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono), monospace' }}>
            {fmtAge(item.mintedDaysAgo)}
          </span>
        </div>
      </div>

      <Spark data={spark} up={up} width={80} height={36} />

      <div style={{ textAlign: 'right', minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {item.floor.toFixed(2)} <span style={{ fontSize: 13, opacity: 0.85 }}>Ξ</span>
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

function Skeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '56px 1fr 80px 80px',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            alignItems: 'center',
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />
          <div>
            <div style={{ height: 14, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ marginTop: 8, height: 10, width: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div style={{ height: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
          <div>
            <div style={{ height: 14, width: '80%', marginLeft: 'auto', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ marginTop: 6, height: 10, width: '60%', marginLeft: 'auto', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
