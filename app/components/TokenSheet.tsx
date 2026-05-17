'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, Share2, Star, Bell, ChevronDown, RotateCcw, RotateCw,
  CandlestickChart, LineChart, Wallet, Copy, Settings, Edit3, Flame,
  Sprout,
} from 'lucide-react';
import { type Collection, generateCandles, shortAddr } from '../data';
import CandleChart from './CandleChart';

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

export default function TokenSheet({ c, onClose }: { c: Collection; onClose: () => void }) {
  const [tf, setTf] = useState<Timeframe>('1m');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [denom, setDenom] = useState<'usd' | 'eth'>('usd');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.opensea.io/api/v2/collections/${c.slug}/stats`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d?.total?.floor_price) setLivePrice(Number(d.total.floor_price)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [c.slug]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  const floor = livePrice ?? c.floor;
  const up = c.change24h >= 0;
  const mcEth   = floor * c.supply;
  const mcUsd   = mcEth * ETH_USD;
  const athEth  = mcEth * (1 + Math.abs(c.change24h) / 100 * 0.6 + 0.18);
  const athUsd  = athEth * ETH_USD;
  const todayPct = c.change24h;
  const watchers = Math.round(c.owners / 150);

  const candles = useMemo(() => generateCandles(c.slug + tf, denom === 'usd' ? mcUsd : mcEth, CANDLE_COUNTS[tf]),
    [c.slug, tf, denom, mcUsd, mcEth]);

  const headlineValue = denom === 'usd' ? mcUsd : mcEth;
  const athValue      = denom === 'usd' ? athUsd : athEth;
  const headlineUnit  = denom === 'usd' ? '' : 'Ξ';
  const headlineLabel = 'MC';
  const bondPct = Math.min(99, Math.round((headlineValue / athValue) * 100));

  const hueA = (c.ticker.charCodeAt(0) * 23) % 360;
  const hueB = (c.ticker.charCodeAt(1) * 41) % 360;

  const copyCa = () => {
    const fake = '0x' + c.slug.replace(/[^a-z0-9]/g, '').padEnd(40, '0').slice(0, 40);
    navigator.clipboard?.writeText(fake);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-md md:max-h-[92vh] md:rounded-3xl bg-[#05030a] border-t md:border border-white/8 rounded-t-3xl overflow-hidden slide-up flex flex-col">
        {/* ============ HEADER ============ */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-white/6 shrink-0">
          <button onClick={onClose} className="p-1.5 -ml-1 text-white/85 hover:text-white">
            <ChevronLeft size={22} />
          </button>

          <div
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 font-display font-bold text-white text-xs"
            style={{ background: `linear-gradient(135deg, hsl(${hueA} 70% 45%), hsl(${hueB} 70% 55%))` }}
          >
            {c.ticker.slice(0, 2)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-white text-[15px] leading-tight truncate">{c.name}</div>
            <button onClick={copyCa} className="flex items-center gap-1.5 text-[11px] text-white/55 font-mono mt-0.5">
              <span className="text-white/80">{c.ticker}</span>
              <span className="text-white/30">|</span>
              <span className="truncate max-w-[140px]">{c.slug.slice(0, 4)}…{c.slug.slice(-4)}</span>
              <Copy size={10} className={copied ? 'text-up' : 'opacity-60'} />
            </button>
          </div>

          <button className="p-1.5 text-white/65 hover:text-white" aria-label="Share"><Share2 size={18}/></button>
          <button onClick={() => setStarred(s => !s)} className="p-1.5" aria-label="Watch">
            <Star size={18} className={starred ? 'fill-amber-300 text-amber-300' : 'text-white/65'} />
          </button>
          <button className="p-1.5 text-white/65 hover:text-white" aria-label="Notify"><Bell size={18}/></button>
        </div>

        {/* ============ HEADLINE ============ */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <div className="font-display font-black text-white text-[34px] leading-none tracking-tight">
                  {denom === 'usd' ? fmtMc(mcUsd) : `${mcEth.toFixed(0)}Ξ`}
                </div>
                <div className="text-white/55 text-xs font-mono mb-0.5">{headlineLabel}</div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-mono">
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                  up ? 'bg-emerald-500/15 text-up' : 'bg-rose-500/15 text-down'
                }`}>
                  <span className="text-[10px]">{up ? '↑' : '↓'}</span>
                  {Math.abs(todayPct * 100).toFixed(1)}% <span className="opacity-75 ml-0.5">Today</span>
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/70 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full border border-white/40" />
                  {watchers}
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/55 flex items-center gap-1"><Sprout size={10}/>{fakeAge(c.slug)}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center gap-1.5 justify-end text-[11px] font-mono text-white/85">
                {denom === 'usd' ? fmtMc(athUsd) : `${athEth.toFixed(0)}Ξ`}
                <span className="text-white/55">ATH</span>
                <RotateCw size={11} className="text-white/45" />
              </div>
              {/* Bond / ATH progress bar */}
              <div className="mt-2 w-[140px] h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${bondPct}%`,
                    background: 'linear-gradient(90deg, #0f6b3b 0%, #22c55e 60%, #a7f3d0 100%)',
                    boxShadow: '0 0 8px rgba(34,197,94,0.55)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============ CHART TOOLBAR ============ */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 shrink-0 text-[11px] font-mono">
          <button className="flex items-center gap-1 text-white/85">
            <span className="font-bold">{tf}</span>
            <ChevronDown size={12} className="opacity-60" />
          </button>
          <button
            onClick={() => setChartType(t => t === 'candle' ? 'line' : 'candle')}
            className="text-white/75 hover:text-white"
            aria-label="Chart type"
          >
            {chartType === 'candle' ? <CandlestickChart size={14}/> : <LineChart size={14}/>}
          </button>
          <button
            onClick={() => setDenom('usd')}
            className={`font-bold ${denom === 'usd' ? 'text-up' : 'text-white/45'}`}
          >
            MCAP<span className="text-white/30">/</span>{denom === 'usd' ? 'USD' : 'USD'}
          </button>
          <button
            onClick={() => setDenom('eth')}
            className={`font-bold ${denom === 'eth' ? 'text-up' : 'text-white/45'}`}
          >
            FLOOR<span className="text-white/30">/</span>ETH
          </button>
          <div className="ml-auto flex items-center gap-2 text-white/35">
            <RotateCcw size={13} />
            <RotateCw  size={13} />
          </div>
        </div>

        {/* ============ CHART ============ */}
        <div className="px-1 py-2 bg-[#04020a] shrink-0">
          {chartType === 'candle' ? (
            <CandleChart candles={candles} currentPrice={headlineValue} height={300} />
          ) : (
            <LineFallback candles={candles} up={up} height={300} />
          )}
        </div>

        {/* ============ TIMEFRAME TABS ============ */}
        <div className="flex items-center gap-1 px-2 py-2 border-y border-white/6 shrink-0 text-[11px] font-mono">
          {TF.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-3 py-1 rounded-full transition ${
                tf === t ? 'bg-white/12 text-white font-bold' : 'text-white/55 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-white/45 pr-1">
            <LineChart size={14} />
            <Settings size={14} />
          </div>
        </div>

        {/* ============ SCROLLABLE BODY: QUICK BUY + ABOUT ============ */}
        <div className="flex-1 overflow-y-auto pb-[110px]">
          {/* Quick buy chips */}
          <div className="px-3 py-3 grid grid-cols-3 gap-2">
            {['0.05', '0.1', '0.2'].map((amt) => (
              <button
                key={amt}
                className="rounded-full bg-emerald-900/35 border border-emerald-600/40 hover:bg-emerald-800/45 hover:border-emerald-500/60 transition py-2.5 flex items-center justify-center gap-1.5 text-up font-display font-bold"
              >
                <span className="text-base">{amt}</span>
                <EthGlyph />
              </button>
            ))}
          </div>

          {/* Utility row */}
          <div className="px-4 py-2 flex items-center justify-between text-white/65">
            <div className="flex items-center gap-3">
              <button className="hover:text-white"><Edit3 size={15}/></button>
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />
            </div>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-xs font-mono">
              <Flame size={12} className="text-amber-400"/>
              <Wallet size={11} className="ml-0.5"/>
              <span>$0.00</span>
              <span className="text-white/35">0 Ξ</span>
            </button>
          </div>

          {/* About */}
          <div className="px-4 mt-3">
            <div className="rounded-2xl bg-white/4 border border-white/8 px-3.5 py-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center text-white">i</span>
              <span className="text-sm">About</span>
            </div>
            <div className="text-[12px] text-white/55 mt-3 leading-relaxed">
              {c.name} ({c.ticker}) is a {c.supply.toLocaleString()}-piece NFT collection with {c.owners.toLocaleString()} unique holders. Floor sits at {floor.toFixed(2)} Ξ with 24H volume of {c.volume24h.toLocaleString()} Ξ.
            </div>
          </div>
        </div>

        {/* ============ BIG BOTTOM BUY BUTTON ============ */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#02000a]/95 backdrop-blur border-t border-white/8 px-3 py-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <button className="w-full rounded-full bg-white text-black py-3.5 font-display font-black text-base tracking-wider uppercase active:scale-[0.99] transition shadow-[0_-10px_40px_-20px_rgba(255,255,255,0.4)]">
            Buy {c.ticker} · {floor.toFixed(2)} Ξ
          </button>
        </div>
      </div>
    </div>
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

/** Tiny line-chart fallback when the user toggles off candles. */
function LineFallback({ candles, up, height }: { candles: any[]; up: boolean; height: number }) {
  const data = candles.map(c => c.c);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 92;
    const y = 8 + (1 - (v - min) / range) * 78;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline
        fill="none"
        stroke={up ? '#22c55e' : '#ef4444'}
        strokeWidth="0.4"
        vectorEffect="non-scaling-stroke"
        points={pts}
      />
    </svg>
  );
}
