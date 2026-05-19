'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, Share2, Star, Bell, ChevronDown,
  CandlestickChart, LineChart, Wallet, Copy, Sprout, Settings,
  Info, X,
} from 'lucide-react';
import {
  type Collection, type Candle as CandleData,
  generateCandles, fetchOpenSeaCollection,
} from '../data';
import Candle, { type Unit, type Mode } from './Candle';
import Thumb from './Thumb';
import { useWalletGate } from '../hooks/useWalletGate';
import { useOpenSeaStream } from '../hooks/useOpenSeaStream';
import { toast } from './Toast';

const ETH_USD = 3000;

const TF = ['1m', '5m', '15m', '1h', '4h', '1d', 'All'] as const;
type Timeframe = typeof TF[number];

const TF_BARS:    Record<Timeframe, number> = { '1m': 48, '5m': 56, '15m': 60, '1h': 64, '4h': 60, '1d': 52, 'All': 80 };
const TF_SECONDS: Record<Timeframe, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400, 'All': 86400 * 30 };
const TF_VOL:     Record<Timeframe, number> = { '1m': 0.5, '5m': 0.9, '15m': 1.2, '1h': 1.8, '4h': 2.5, '1d': 4.0, 'All': 6.0 };

const POLL_MS = 30_000;
const STAR_KEY = 'degensea-stars';

function fmtUsd(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtEthCompact(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (n >= 100) return n.toFixed(0);
  return n.toFixed(1);
}
function fakeAge(slug: string) {
  let s = 0;
  for (let i = 0; i < slug.length; i++) s = (s * 31 + slug.charCodeAt(i)) | 0;
  const days = Math.abs(s) % 1500 + 5;
  if (days >= 365) return `${Math.floor(days / 365)}y`;
  if (days >= 30)  return `${Math.floor(days / 30)}mo`;
  return `${days}d`;
}
function readStars(): string[] {
  try { return JSON.parse(localStorage.getItem(STAR_KEY) || '[]'); } catch { return []; }
}
function writeStars(s: string[]) {
  try { localStorage.setItem(STAR_KEY, JSON.stringify(s)); } catch {}
}

function buildTimeFormatter(tf: Timeframe, n: number, anchor: number) {
  const barSec = TF_SECONDS[tf];
  return (idx: number) => {
    const secondsAgo = (n - 1 - idx) * barSec;
    const d = new Date(anchor - secondsAgo * 1000);
    if (tf === '1d' || tf === 'All' || barSec >= 3600 * 12) {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
}

const PRESET_QTY = [1, 2, 4, 8];

export default function TokenDetail({ c, onClose }: { c: Collection; onClose: () => void }) {
  const [tf, setTf] = useState<Timeframe>('1m');
  const [mode, setMode] = useState<Mode>('candle');
  const [unit, setUnit] = useState<Unit>('eth');
  const [live, setLive] = useState<Collection>(c);
  const [starred, setStarred] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chartWidth, setChartWidth] = useState(360);
  const [qty, setQty] = useState<number>(1);
  const [customText, setCustomText] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [tfMenuOpen, setTfMenuOpen] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [candles, setCandles] = useState<CandleData[]>(() =>
    generateCandles(c.slug + '1m', c.floor, TF_BARS['1m'], TF_VOL['1m']),
  );
  const gate = useWalletGate();
  const initialFetch = useRef(false);

  // Re-fetch on open
  useEffect(() => {
    if (initialFetch.current) return;
    initialFetch.current = true;
    fetchOpenSeaCollection(c).then(setLive);
  }, [c]);

  // Live polling: refresh floor + image every POLL_MS
  useEffect(() => {
    const id = setInterval(async () => {
      const updated = await fetchOpenSeaCollection(c);
      setLive(prev => ({ ...prev, ...updated }));
      setNow(Date.now());
    }, POLL_MS);
    return () => clearInterval(id);
  }, [c]);

  // Live stream from the OpenSea relay (Railway). No-op when
  // NEXT_PUBLIC_STREAM_URL isn't set. For now we listen to listings
  // and let any new listing at or below floor drive floor down.
  useOpenSeaStream(c.slug, (event) => {
    if (event.event_type !== 'item_listed') return;
    const wei  = event.payload?.base_price;
    const dec  = event.payload?.payment_token?.decimals ?? 18;
    if (!wei) return;
    const price = Number(wei) / Math.pow(10, dec);
    if (!Number.isFinite(price) || price <= 0) return;
    setLive(prev => {
      if (!prev.floor || price < prev.floor) {
        return { ...prev, floor: price };
      }
      return prev;
    });
    setNow(Date.now());
  });

  // Regenerate full candle series when TF or slug changes
  useEffect(() => {
    setCandles(generateCandles(c.slug + tf, live.floor || c.floor, TF_BARS[tf], TF_VOL[tf]));
    setNow(Date.now());
  }, [tf, c.slug, live.floor, c.floor]);

  // When live floor moves, update the last candle in place
  useEffect(() => {
    if (!live.floor) return;
    setCandles(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = { ...next[next.length - 1] };
      last.c = live.floor;
      last.h = Math.max(last.h, live.floor);
      last.l = Math.min(last.l, live.floor);
      next[next.length - 1] = last;
      return next;
    });
  }, [live.floor]);

  // Body scroll lock + ESC to close + chart width measure
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
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
    setStarred(readStars().includes(c.slug));
  }, [c.slug]);

  const toggleStar = () => {
    const stars = readStars();
    const next = stars.includes(c.slug) ? stars.filter(s => s !== c.slug) : [...stars, c.slug];
    writeStars(next);
    setStarred(next.includes(c.slug));
    toast(next.includes(c.slug) ? `★ Watching ${c.ticker}` : `Removed ${c.ticker}`);
  };

  const handleBuy = () => gate(() => toast(`Bought ${qty} ${c.ticker} for ${total.toFixed(2)} Ξ`));

  const handleShare = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?t=${c.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: `$${c.ticker}`, text: c.name, url });
      else { await navigator.clipboard.writeText(url); toast('Link copied'); }
    } catch {}
  };

  const floor    = live.floor;
  const up       = live.change24h >= 0;
  const total    = qty * floor;
  const mcEth    = floor * live.supply;
  const mcUsd    = mcEth * ETH_USD;
  const athEth   = mcEth * (1 + Math.abs(live.change24h) / 100 * 0.6 + 0.18);
  const watchers = Math.round(live.owners / 150);

  const headline =
    unit === 'eth'  ? `${fmtEthCompact(mcEth)} Ξ` :
    unit === 'usd'  ? fmtUsd(mcUsd) :
                      `${fmtEthCompact(mcEth)} Ξ`;
  const athLabel =
    unit === 'eth'  ? `${fmtEthCompact(athEth)} Ξ` :
    unit === 'usd'  ? fmtUsd(athEth * ETH_USD) :
                      `${fmtEthCompact(athEth)} Ξ`;

  const bondPct = Math.min(99, Math.round((mcEth / athEth) * 100));

  const timeFor = useMemo(
    () => buildTimeFormatter(tf, candles.length, now),
    [tf, candles.length, now],
  );

  const copyCa = () => {
    const fake = '0x' + c.slug.replace(/[^a-z0-9]/g, '').padEnd(40, '0').slice(0, 40);
    navigator.clipboard?.writeText(fake);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  const onPresetTap = (n: number) => { setQty(n); setCustomText(''); };
  const onCustomChange = (v: string) => {
    const cleaned = v.replace(/[^0-9]/g, '').slice(0, 4);
    setCustomText(cleaned);
    const n = parseInt(cleaned) || 0;
    if (n > 0) setQty(n);
  };
  const isCustomActive = customText !== '' && !PRESET_QTY.includes(qty);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        display: 'flex', flexDirection: 'column',
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
          width: '100%', maxWidth: 480, margin: 'auto auto 0',
          background: '#05030a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px 24px 0 0',
          display: 'flex', flexDirection: 'column',
          maxHeight: '94vh', overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose} aria-label="Back"
            style={{ padding: 4, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
          >
            <ChevronLeft size={22} />
          </button>

          <Thumb collection={live} size={36} radius={999} />

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1.2, minWidth: 0, flexShrink: 1,
                }}
              >
                {live.name}
              </div>
              <button
                onClick={() => setAboutOpen(true)}
                aria-label="About"
                style={{
                  flexShrink: 0,
                  width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <Info size={11} />
              </button>
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
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>{live.ticker}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <span>{live.slug.slice(0, 4)}…{live.slug.slice(-4)}</span>
              <Copy size={10} color={copied ? 'rgb(34,197,94)' : undefined} style={{ opacity: copied ? 1 : 0.6 }} />
            </button>
          </div>

          <IconBtn label="Share" onClick={handleShare}><Share2 size={18} /></IconBtn>
          <IconBtn label="Watch" onClick={toggleStar}>
            <Star size={18} fill={starred ? '#fbbf24' : 'none'} color={starred ? '#fbbf24' : undefined} />
          </IconBtn>
          <IconBtn label="Notify" onClick={() => toast(`Alerts on for ${live.ticker}`)}>
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
                    fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1,
                    letterSpacing: '-0.02em', fontFamily: 'var(--font-mono), monospace',
                  }}
                >
                  {headline}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono), monospace' }}>
                  MC
                </div>
              </div>
              {unit === 'both' && (
                <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono), monospace' }}>
                  · {fmtUsd(mcUsd)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    padding: '2px 6px', borderRadius: 6,
                    background: up ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: up ? 'var(--up)' : 'var(--down)',
                  }}
                >
                  {up ? '↑' : '↓'} {Math.abs(live.change24h).toFixed(1)}%
                  <span style={{ opacity: 0.7, marginLeft: 2 }}>24H</span>
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
                <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--up)' }} title="Live" />
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.85)' }}>
                {athLabel}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>ATH</span>
              </div>
              <div style={{ marginTop: 8, width: 140, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${bondPct}%`,
                  background: 'linear-gradient(90deg, #0f6b3b 0%, #22c55e 60%, #a7f3d0 100%)',
                  boxShadow: '0 0 8px rgba(34,197,94,0.55)',
                }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginTop: 6, fontFamily: 'var(--font-mono), monospace' }}>
                Floor {floor.toFixed(2)} Ξ
              </div>
            </div>
          </div>
        </div>

        {/* CHART TOOLBAR */}
        <div
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: 11, fontFamily: 'var(--font-mono), monospace',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setTfMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
            }}
          >
            <strong>{tf}</strong>
            <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </button>

          {tfMenuOpen && (
            <div
              style={{
                position: 'absolute', top: 32, left: 16, zIndex: 5,
                background: '#08040f',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, padding: 4,
                display: 'flex', flexDirection: 'column', gap: 1,
                boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                minWidth: 60,
              }}
            >
              {TF.map(t => (
                <button
                  key={t}
                  onClick={() => { setTf(t); setTfMenuOpen(false); }}
                  style={{
                    padding: '6px 10px', borderRadius: 4,
                    background: tf === t ? 'rgba(34,197,94,0.2)' : 'transparent',
                    color: tf === t ? 'var(--up)' : 'rgba(255,255,255,0.75)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-mono), monospace',
                    textAlign: 'left', fontSize: 11, fontWeight: 700,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <ToggleIcon
            mode={mode}
            onChange={setMode}
          />

          <UnitToggle unit={unit} onChange={setUnit} />
        </div>

        {/* CHART */}
        <div id="chart-frame" style={{ padding: 4, background: '#04020a', flexShrink: 0 }}>
          <Candle
            candles={candles}
            currentPrice={floor}
            unit={unit}
            ethUsd={ETH_USD}
            width={chartWidth - 8}
            height={300}
            mode={mode}
            timeFor={timeFor}
          />
        </div>

        {/* TIMEFRAME PILLS */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '8px 8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            fontSize: 11, fontFamily: 'var(--font-mono), monospace',
            overflowX: 'auto',
          }}
          className="hide-scrollbar"
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
                border: 'none', cursor: 'pointer',
                flexShrink: 0,
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
          {/* Quantity pills */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 12px' }}>
            {PRESET_QTY.map(n => {
              const selected = !isCustomActive && qty === n;
              return (
                <button
                  key={n}
                  onClick={() => (selected ? handleBuy() : onPresetTap(n))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 999,
                    background: selected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(16, 88, 50, 0.4)',
                    border: selected ? '2px solid var(--up)' : '1px solid rgba(34, 197, 94, 0.4)',
                    color: selected ? '#fff' : 'var(--up)',
                    fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-mono), monospace',
                    transition: 'all 120ms ease',
                  }}
                >
                  {n}
                </button>
              );
            })}
            <input
              type="text"
              inputMode="numeric"
              value={customText}
              onChange={e => onCustomChange(e.target.value)}
              placeholder="N"
              style={{
                flex: 1, padding: '10px 0', borderRadius: 999,
                background: isCustomActive ? 'rgba(34, 197, 94, 0.5)' : 'rgba(16, 88, 50, 0.4)',
                border: isCustomActive ? '2px solid var(--up)' : '1px solid rgba(34, 197, 94, 0.4)',
                color: isCustomActive ? '#fff' : 'var(--up)',
                fontSize: 16, fontWeight: 700,
                fontFamily: 'var(--font-mono), monospace',
                textAlign: 'center', outline: 'none', minWidth: 0,
              }}
            />
          </div>

          <div style={{ padding: '4px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono), monospace' }}>
              {qty} {live.ticker} = {total.toFixed(2)} Ξ · {fmtUsd(total * ETH_USD)}
            </span>
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
            </div>
          </div>
        </div>

        {/* BIG BUY BUTTON */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
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
            onClick={handleBuy}
          >
            <span>Buy {qty} {live.ticker} · {total.toFixed(2)} Ξ</span>
          </button>
        </div>
      </div>

      {/* ABOUT MODAL */}
      {aboutOpen && (
        <AboutModal collection={live} onClose={() => setAboutOpen(false)} />
      )}
    </div>
  );
}

function AboutModal({ collection, onClose }: { collection: Collection; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          position: 'relative',
          background: '#0a0512',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18,
          padding: 18,
          maxWidth: 380, width: '100%',
          maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Thumb collection={collection} size={40} radius={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {collection.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono), monospace' }}>
              ${collection.ticker} · {collection.supply.toLocaleString()} supply
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28, height: 28, borderRadius: 999,
              background: 'rgba(255,255,255,0.08)', border: 'none',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
          {collection.name} ({collection.ticker}) is a {collection.supply.toLocaleString()}-piece NFT
          collection on Ethereum with {collection.owners.toLocaleString()} unique holders. Floor sits
          at {collection.floor.toFixed(2)} Ξ with 24H volume of {collection.volume24h.toLocaleString()} Ξ.
        </p>

        <div
          style={{
            marginTop: 14, padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
            fontSize: 11, fontFamily: 'var(--font-mono), monospace',
          }}
        >
          <Stat k="Floor"   v={`${collection.floor.toFixed(3)} Ξ`} />
          <Stat k="Vol 24H" v={`${collection.volume24h.toLocaleString()} Ξ`} />
          <Stat k="Holders" v={collection.owners.toLocaleString()} />
          <Stat k="Supply"  v={collection.supply.toLocaleString()} />
        </div>

        <a
          href={`https://opensea.io/collection/${collection.slug}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center', marginTop: 14,
            padding: '10px 0', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', textDecoration: 'none',
          }}
        >
          View on OpenSea →
        </a>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)' }}>{k}</div>
      <div style={{ color: '#fff', marginTop: 2 }}>{v}</div>
    </div>
  );
}

function ToggleIcon({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => onChange('candle')}
        aria-label="Candles"
        style={{
          width: 22, height: 20, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: mode === 'candle' ? 'rgba(34,197,94,0.25)' : 'transparent',
          color: mode === 'candle' ? 'var(--up)' : 'rgba(255,255,255,0.5)',
          border: 'none', borderRadius: 4, cursor: 'pointer',
        }}
      >
        <CandlestickChart size={13} />
      </button>
      <button
        onClick={() => onChange('line')}
        aria-label="Line"
        style={{
          width: 22, height: 20, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: mode === 'line' ? 'rgba(34,197,94,0.25)' : 'transparent',
          color: mode === 'line' ? 'var(--up)' : 'rgba(255,255,255,0.5)',
          border: 'none', borderRadius: 4, cursor: 'pointer',
        }}
      >
        <LineChart size={13} />
      </button>
    </div>
  );
}

function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  const opts: Unit[] = ['eth', 'usd', 'both'];
  return (
    <div
      style={{
        marginLeft: 'auto',
        display: 'inline-flex',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 999, padding: 2, gap: 2,
      }}
    >
      {opts.map(o => {
        const active = unit === o;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              padding: '3px 10px', borderRadius: 999,
              background: active ? 'var(--up)' : 'transparent',
              color: active ? '#001b0f' : 'rgba(255,255,255,0.55)',
              fontSize: 10, fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono), monospace',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function IconBtn({
  children, label, onClick,
}: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick} aria-label={label}
      style={{
        width: 32, height: 32, padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
