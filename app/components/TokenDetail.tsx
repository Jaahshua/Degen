'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, Share2, Star, Bell, ChevronDown, RotateCcw, RotateCw,
  CandlestickChart, Wallet, Copy, Sprout, Settings,
} from 'lucide-react';
import { type Collection, generateCandles } from '../data';
import Candle from './Candle';
import { useWalletGate } from '../hooks/useWalletGate';
import { toast } from './Toast';

const ETH_USD = 3000;
const TF = ['1m', '5m', '15m', '1h', '4h', '1d', 'All'] as const;
type Timeframe = typeof TF[number];

const CANDLE_COUNTS: Record<Timeframe, number> = {
  '1m':  48,
  '5m':  56,
  '15m': 60,
  '1h':  64,
  '4h':  60,
  '1d':  52,
  'All': 80,
};

function fmtMc(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
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

const STAR_KEY = 'degensea-stars';

function readStars(): string[] {
  try { return JSON.parse(localStorage.getItem(STAR_KEY) || '[]'); } catch { return []; }
}
function writeStars(s: string[]) {
  try { localStorage.setItem(STAR_KEY, JSON.stringify(s)); } catch {}
}

export default function TokenDetail({ c, onClose }: { c: Collection; onClose: () => void }) {
  const [tf, setTf] = useState<Timeframe>('1m');
  const [denom, setDenom] = useState<'usd' | 'eth'>('usd');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chartWidth, setChartWidth] = useState(360);
  const [buyAmt, setBuyAmt] = useState('0.05');
  const gate = useWalletGate();

  // Star persistence
  useEffect(() => {
    setStarred(readStars().includes(c.slug));
  }, [c.slug]);
  const toggleStar = () => {
    const stars = readStars();
    const next = stars.includes(c.slug) ? stars.filter(s => s !== c.slug) : [...stars, c.slug];
    writeStars(next);
    setStarred(next.includes(c.slug));
    toast(next.includes(c.slug) ? `★ Watching ${c.ticker}` : `Removed ${c.ticker}`);
  };

  const handleBuy = (ethAmt: string) =>
    gate(() => toast(`Bought ${ethAmt} Ξ of ${c.ticker}`));

  const handleShare = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?t=${c.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `$${c.ticker}`, text: c.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
    } catch { /* user cancelled */ }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);

    // Measure available chart width
    const measure = () => {
      const el = document.getElementById('chart-frame');
      if (el) setChartWidth(el.clientWidth);
    };
    measure();
    window.addEventListener('resize', measure);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', esc);
      window.removeEventListener('resize', measure);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.opensea.io/api/v2/collections/${c.slug}/stats`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d?.total?.floor_price) setLivePrice(Number(d.total.floor_price)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [c.slug]);

  const floor   = livePrice ?? c.floor;
  const up      = c.change24h >= 0;
  const mcEth   = floor * c.supply;
  const mcUsd   = mcEth * ETH_USD;
  const athEth  = mcEth * (1 + Math.abs(c.change24h) / 100 * 0.6 + 0.18);
  const athUsd  = athEth * ETH_USD;
  const watchers = Math.round(c.owners / 150);

  const candles = useMemo(
    () => generateCandles(c.slug + tf, denom === 'usd' ? mcUsd : mcEth, CANDLE_COUNTS[tf]),
    [c.slug, tf, denom, mcUsd, mcEth],
  );

  const headline = denom === 'usd' ? mcUsd : mcEth;
  const athVal   = denom === 'usd' ? athUsd : athEth;
  const bondPct  = Math.min(99, Math.round((headline / athVal) * 100));

  const hueA = (c.ticker.charCodeAt(0) * 23) % 360;
  const hueB = (c.ticker.charCodeAt(1) * 41) % 360;

  const copyCa = () => {
    const fake = '0x' + c.slug.replace(/[^a-z0-9]/g, '').padEnd(40, '0').slice(0, 40);
    navigator.clipboard?.writeText(fake);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      <div
        className="slide-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          margin: 'auto auto 0',
          background: '#05030a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Back"
            style={{ padding: 4, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
          >
            <ChevronLeft size={22} />
          </button>

          <div
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: `linear-gradient(135deg, hsl(${hueA} 70% 45%), hsl(${hueB} 70% 55%))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}
          >
            {c.ticker.slice(0, 2)}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 15, fontWeight: 700, color: '#fff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {c.name}
            </div>
            <button
              onClick={copyCa}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2,
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: 'var(--font-mono), monospace',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>{c.ticker}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <span>{c.slug.slice(0, 4)}…{c.slug.slice(-4)}</span>
              <Copy size={10} color={copied ? 'rgb(34,197,94)' : undefined} style={{ opacity: copied ? 1 : 0.6 }} />
            </button>
          </div>

          <IconBtn label="Share" onClick={handleShare}><Share2 size={18} /></IconBtn>
          <IconBtn label="Watch" onClick={toggleStar}>
            <Star size={18} fill={starred ? '#fbbf24' : 'none'} color={starred ? '#fbbf24' : undefined} />
          </IconBtn>
          <IconBtn label="Notify" onClick={() => toast(`Alerts on for ${c.ticker}`)}>
            <Bell size={18} />
          </IconBtn>
        </div>

        {/* HEADLINE */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div
                  style={{
                    fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1,
                    letterSpacing: '-0.02em', fontFamily: 'var(--font-mono), monospace',
                  }}
                >
                  {denom === 'usd' ? fmtMc(mcUsd) : `${mcEth.toFixed(0)}Ξ`}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono), monospace' }}>
                  MC
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    padding: '2px 6px', borderRadius: 6,
                    background: up ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: up ? 'var(--up)' : 'var(--down)',
                  }}
                >
                  {up ? '↑' : '↓'} {Math.abs(c.change24h * 100).toFixed(1)}%
                  <span style={{ opacity: 0.7, marginLeft: 2 }}>Today</span>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.4)' }} />
                  {watchers}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sprout size={10} /> {fakeAge(c.slug)}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.85)' }}>
                {denom === 'usd' ? fmtMc(athUsd) : `${athEth.toFixed(0)}Ξ`}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>ATH</span>
                <RotateCw size={11} style={{ color: 'rgba(255,255,255,0.45)' }} />
              </div>
              <div
                style={{
                  marginTop: 8, width: 140, height: 6, borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%', width: `${bondPct}%`,
                    background: 'linear-gradient(90deg, #0f6b3b 0%, #22c55e 60%, #a7f3d0 100%)',
                    boxShadow: '0 0 8px rgba(34,197,94,0.55)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CHART TOOLBAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: 11,
            fontFamily: 'var(--font-mono), monospace',
            flexShrink: 0,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.85)' }}>
            <strong>{tf}</strong> <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </span>
          <CandlestickChart size={14} style={{ color: 'rgba(255,255,255,0.75)' }} />
          <button
            onClick={() => setDenom('usd')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, color: denom === 'usd' ? 'var(--up)' : 'rgba(255,255,255,0.45)' }}
          >
            MCAP/USD
          </button>
          <button
            onClick={() => setDenom('eth')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, color: denom === 'eth' ? 'var(--up)' : 'rgba(255,255,255,0.45)' }}
          >
            FLOOR/ETH
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, color: 'rgba(255,255,255,0.35)' }}>
            <RotateCcw size={13} /><RotateCw size={13} />
          </div>
        </div>

        {/* CHART */}
        <div id="chart-frame" style={{ padding: 4, background: '#04020a', flexShrink: 0 }}>
          <Candle candles={candles} currentPrice={headline} width={chartWidth - 8} height={300} />
        </div>

        {/* TIMEFRAMES */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            fontSize: 11,
            fontFamily: 'var(--font-mono), monospace',
          }}
        >
          {TF.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                background: tf === t ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: tf === t ? '#fff' : 'rgba(255,255,255,0.55)',
                fontWeight: tf === t ? 700 : 400,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, color: 'rgba(255,255,255,0.45)', paddingRight: 4 }}>
            <Settings size={13} />
          </div>
        </div>

        {/* SCROLL BODY */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
          {/* Quick buy chips — tap once to select, twice to buy */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 12px' }}>
            {['0.05', '0.1', '0.2'].map(amt => {
              const selected = buyAmt === amt;
              return (
                <button
                  key={amt}
                  onClick={() => {
                    if (selected) handleBuy(amt);
                    else setBuyAmt(amt);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0',
                    borderRadius: 999,
                    background: selected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(16, 88, 50, 0.4)',
                    border: selected ? '2px solid var(--up)' : '1px solid rgba(34, 197, 94, 0.4)',
                    color: selected ? '#fff' : 'var(--up)',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono), monospace',
                    transition: 'all 120ms ease',
                  }}
                >
                  {amt}
                  <EthGlyph />
                </button>
              );
            })}
          </div>

          {/* Wallet utility row */}
          <div style={{ padding: '4px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.3)' }} />
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11, fontFamily: 'var(--font-mono), monospace',
              }}
            >
              <Wallet size={11} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>$0.00</span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>0 Ξ</span>
            </div>
          </div>

          {/* About */}
          <div style={{ padding: '16px 16px 0' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span
                style={{
                  width: 16, height: 16, borderRadius: 999,
                  background: 'rgba(255,255,255,0.18)',
                  fontSize: 10, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                i
              </span>
              <span style={{ fontSize: 14 }}>About</span>
            </div>
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.5,
              }}
            >
              {c.name} ({c.ticker}) is a {c.supply.toLocaleString()}-piece NFT collection with{' '}
              {c.owners.toLocaleString()} unique holders. Floor sits at {floor.toFixed(2)} Ξ with 24H volume
              of {c.volume24h.toLocaleString()} Ξ.
            </p>
          </div>
        </div>

        {/* BIG WHITE BUY BUTTON */}
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            background: 'rgba(2,0,10,0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 12px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <button
            className="btn-blood"
            style={{ width: '100%', padding: '14px 0', fontSize: 15 }}
            onClick={() => handleBuy(buyAmt)}
          >
            <span>Buy {c.ticker} · {buyAmt} Ξ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children, label, onClick,
}: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function EthGlyph() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
      <path d="M5.5 0L0 7.2 5.5 10.4 11 7.2 5.5 0Z" fill="currentColor" />
      <path d="M5.5 14L0 8.5 5.5 11.6 11 8.5 5.5 14Z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}
