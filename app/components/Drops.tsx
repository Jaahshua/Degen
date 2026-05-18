'use client';

import { useState, useEffect } from 'react';
import { DROPS, formatCountdown, type Drop } from '../data';
import { Flame, Clock, Users, Bell, ArrowUpRight } from 'lucide-react';

export default function Drops() {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const baseTime = Math.floor(Date.now() / 1000) - 5; // pretend session start
  const now = Math.floor(Date.now() / 1000);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      <h1
        style={{
          margin: '8px 0 16px',
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: '-0.03em',
        }}
      >
        <span className="text-sunset">Sunset</span> Drops
      </h1>

      <div style={{ display: 'grid', gap: 12 }}>
        {DROPS.map(d => <Card key={d.id} d={d} remaining={Math.max(0, baseTime + d.liveInSeconds - now)} />)}
      </div>
    </div>
  );
}

function Card({ d, remaining }: { d: Drop; remaining: number }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        padding: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          borderRadius: 14,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${d.hue1} 0%, ${d.hue2} 50%, ${d.hue3} 100%)`,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 12,
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.22) 0%, transparent 50%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.28) 0%, transparent 50%)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: -8,
            bottom: -10,
            fontSize: 100,
            fontWeight: 900,
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '-0.05em',
            lineHeight: 1,
          }}
        >
          {d.ticker.slice(0, 5)}
        </span>
        {d.hot && (
          <span
            style={{
              position: 'absolute', top: 10, left: 10,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 999,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              fontSize: 10, fontWeight: 700, color: 'var(--pink)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}
          >
            <Flame size={10}/> Hot
          </span>
        )}
        <div style={{ position: 'relative', color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em' }}>
          ${d.ticker}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>by {d.artist}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono), monospace' }}>
            {d.priceEth} Ξ
          </div>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-mono), monospace',
              marginTop: 2,
            }}
          >
            <Users size={10}/>{d.supply.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontFamily: 'var(--font-mono), monospace',
          }}
          className="text-sunset"
        >
          <Clock size={12}/>
          {remaining === 0 ? 'LIVE' : formatCountdown(remaining)}
        </div>
        {remaining === 0 ? (
          <button className="btn-blood" style={{ padding: '6px 14px', fontSize: 11 }}>
            <span>Mint</span> <ArrowUpRight size={11}/>
          </button>
        ) : (
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            Remind <Bell size={11}/>
          </button>
        )}
      </div>
    </div>
  );
}
