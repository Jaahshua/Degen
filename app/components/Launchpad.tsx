'use client';

import { LAUNCH_TOKENS, formatUsd, formatAge, type LaunchToken } from '../data';
import { Rocket, ArrowUpRight, ArrowDownRight, Users, Clock } from 'lucide-react';

export default function Launchpad() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      <div
        style={{
          padding: '20px 16px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(107,45,196,0.25) 0%, rgba(0,0,0,0) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: 'rgba(255,61,138,0.85)',
            textTransform: 'uppercase', letterSpacing: '0.18em',
          }}
        >
          <Rocket size={11}/> Sunset Launchpad
        </div>
        <h1
          style={{
            margin: '8px 0 6px',
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          Launch &amp; trade <span className="text-sunset">meme coins</span>
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Anyone can launch on a bonding curve. Buy early, sell into momentum, graduate to mainnet.
        </p>
        <button
          className="btn-blood"
          style={{ marginTop: 14, padding: '10px 18px', fontSize: 13 }}
        >
          <Rocket size={13}/> <span>Launch new token</span>
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {LAUNCH_TOKENS.map(t => <Card key={t.id} t={t} />)}
      </div>
    </div>
  );
}

function Card({ t }: { t: LaunchToken }) {
  const up = t.change24h >= 0;
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          padding: '10px 12px',
          background: `linear-gradient(135deg, ${t.hue1} 0%, ${t.hue2} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            position: 'absolute',
            right: -6, bottom: -10,
            fontSize: 64, fontWeight: 900,
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '-0.05em', lineHeight: 1,
          }}
        >
          {t.ticker.slice(0, 5)}
        </span>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>${t.ticker}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{t.name}</div>
        </div>
        <div style={{ position: 'relative', textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono), monospace',
              color: up ? '#bbf7d0' : '#fecaca',
            }}
          >
            {up ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
            {up ? '+' : ''}{t.change24h.toFixed(0)}%
          </div>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 10, color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-mono), monospace',
              marginTop: 2,
            }}
          >
            <Clock size={9}/>{formatAge(t.ageMin)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          padding: '10px 12px',
          fontSize: 11,
          fontFamily: 'var(--font-mono), monospace',
        }}
      >
        <Stat label="Price"   value={formatUsd(t.priceUsd)} />
        <Stat label="MC"      value={formatUsd(t.marketcap)} />
        <Stat label="Holders" value={<><Users size={9} style={{ display: 'inline', verticalAlign: 'baseline', marginRight: 2 }}/>{t.holders}</>} />
      </div>

      <div style={{ padding: '0 12px 10px' }}>
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${t.bondingPct}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${t.hue1}, ${t.hue2})`,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bonding</span>
          <span className="text-sunset" style={{ fontWeight: 700 }}>{t.bondingPct}%</span>
        </div>
        <button
          className="btn-blood"
          style={{ width: '100%', marginTop: 10, padding: '8px 0', fontSize: 12 }}
        >
          <span>Buy {t.ticker}</span>
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
      <div style={{ color: '#fff', marginTop: 2 }}>{value}</div>
    </div>
  );
}
