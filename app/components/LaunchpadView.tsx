'use client';

import { useMemo, useState } from 'react';
import { Rocket, Flame, Sparkles, X, ArrowUpRight, ArrowDownRight, Users, Clock, Crown } from 'lucide-react';
import { LAUNCH_TOKENS, formatUsd, formatAge, type LaunchToken } from '../data';

const FILTERS = [
  { id: 'new',  label: 'New',              icon: Sparkles },
  { id: 'hot',  label: 'Hot',              icon: Flame    },
  { id: 'near', label: 'Near Graduation',  icon: Crown    },
] as const;
type FilterId = typeof FILTERS[number]['id'];

function BondingCurve({ pct, hue1, hue2 }: { pct: number; hue1: string; hue2: string }) {
  const points = Array.from({ length: 24 }, (_, i) => {
    const x = i / 23;
    const y = 1 - Math.pow(x, 2.5);
    return [x * 100, y * 100] as const;
  });
  const fillPct = Math.min(100, Math.max(0, pct));
  const id = `g-${hue1.slice(1)}-${hue2.slice(1)}`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor={hue1} />
          <stop offset="100%" stopColor={hue2} />
        </linearGradient>
      </defs>
      <polyline points={points.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
      <rect x="0" y="92" width="100" height="6" fill="rgba(255,255,255,0.06)" rx="2" />
      <rect x="0" y="92" width={fillPct} height="6" fill={`url(#${id})`} rx="2" />
    </svg>
  );
}

export default function LaunchpadView({ search }: { search: string }) {
  const [filter, setFilter] = useState<FilterId>('new');
  const [buy, setBuy] = useState<LaunchToken | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);

  const tokens = useMemo<LaunchToken[]>(() => {
    const q = search.trim().toLowerCase();
    let list = LAUNCH_TOKENS;
    if (q) list = list.filter(t => t.ticker.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
    const s = [...list];
    if (filter === 'new')  s.sort((a, b) => a.ageMin - b.ageMin);
    if (filter === 'hot')  s.sort((a, b) => b.change24h - a.change24h);
    if (filter === 'near') s.sort((a, b) => b.bondingPct - a.bondingPct);
    return s;
  }, [search, filter]);

  return (
    <div className="px-3 md:px-6 pt-4 pb-32 md:pb-16 max-w-7xl mx-auto space-y-6">
      {/* HERO */}
      <div className="relative card-hot p-5 md:p-7 overflow-hidden">
        <div className="absolute -top-24 -right-12 w-[320px] h-[320px] rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-12 w-[260px] h-[260px] rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-pink-300/90 text-[10px] uppercase tracking-[0.22em] mb-2">
              <Rocket size={12}/> Sunset Launchpad
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl tracking-mega leading-none">
              Launch &amp; trade <span className="text-sunset">meme coins</span>
            </h1>
            <p className="text-white/55 mt-2 max-w-md text-sm">
              Anyone can launch on a bonding curve. Buy early, sell into momentum, graduate to mainnet.
            </p>
          </div>
          <button
            onClick={() => setLaunchOpen(true)}
            className="btn-sunset rounded-2xl px-5 py-3.5 font-display font-black text-sm tracking-wider uppercase flex items-center gap-2 self-start pulse-glow"
          >
            <Rocket size={14}/> Launch new token
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          {FILTERS.map(f => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-display font-bold tracking-wider uppercase transition ${
                  active ? 'btn-sunset' : 'bg-white/4 border border-white/8 text-white/65 hover:text-white hover:border-pink-400/30'
                }`}
              >
                <f.icon size={12}/>
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-white/40 font-mono">{tokens.length} live</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tokens.map(t => <TokenRow key={t.id} t={t} onBuy={() => setBuy(t)} />)}
        {tokens.length === 0 && (
          <div className="col-span-full card p-10 text-center text-white/40 text-sm">No tokens match.</div>
        )}
      </div>

      {buy && <BuyModal t={buy} onClose={() => setBuy(null)} />}
      {launchOpen && <LaunchModal onClose={() => setLaunchOpen(false)} />}
    </div>
  );
}

function TokenRow({ t, onBuy }: { t: LaunchToken; onBuy: () => void }) {
  const up = t.change24h >= 0;
  return (
    <div className="card overflow-hidden p-4 hover:border-pink-400/35 transition">
      {/* Header with watermark */}
      <div
        className="relative -mx-4 -mt-4 mb-3 px-4 py-3 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${t.hue1} 0%, ${t.hue2} 100%)` }}
      >
        <span className="absolute -bottom-3 -right-2 font-display font-black tracking-mega text-white/15 leading-none text-[80px] select-none pointer-events-none">
          {t.ticker.slice(0, 5)}
        </span>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="font-display font-black text-white text-lg leading-none drop-shadow">${t.ticker}</div>
            <div className="text-[11px] text-white/80 mt-0.5 truncate max-w-[160px]">{t.name}</div>
          </div>
          <div className={`text-right shrink-0 ${up ? 'text-emerald-100' : 'text-rose-100'}`}>
            <div className="font-mono text-sm font-bold flex items-center gap-0.5 justify-end">
              {up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
              {up ? '+' : ''}{t.change24h.toFixed(0)}%
            </div>
            <div className="text-[10px] text-white/70 flex items-center gap-0.5 justify-end font-mono">
              <Clock size={9}/>{formatAge(t.ageMin)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
        <Cell k="Price"   v={formatUsd(t.priceUsd)} />
        <Cell k="MC"      v={formatUsd(t.marketcap)} />
        <Cell k="Holders" v={<span className="flex items-center gap-0.5"><Users size={9}/>{t.holders}</span>} />
      </div>

      <div className="mt-3">
        <BondingCurve pct={t.bondingPct} hue1={t.hue1} hue2={t.hue2} />
        <div className="flex items-center justify-between text-[10px] mt-0.5">
          <span className="text-white/40 uppercase tracking-widest">Bonding</span>
          <span className="font-mono text-sunset font-bold">{t.bondingPct}%</span>
        </div>
      </div>

      <button onClick={onBuy} className="btn-sunset w-full mt-3 rounded-lg py-2 text-xs font-display font-bold tracking-wider uppercase">
        Buy {t.ticker}
      </button>
    </div>
  );
}

function Cell({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-white/40">{k}</div>
      <div className="mt-0.5 text-white">{v}</div>
    </div>
  );
}

function BuyModal({ t, onClose }: { t: LaunchToken; onClose: () => void }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amt, setAmt] = useState('0.1');
  const ethUsd = 2400;
  const usd = (parseFloat(amt) || 0) * ethUsd;
  const tokens = usd / t.priceUsd;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-display font-bold text-white"
                 style={{ background: `linear-gradient(135deg, ${t.hue1}, ${t.hue2})` }}>
              {t.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="font-display font-black tracking-tight">${t.ticker}</div>
              <div className="text-[11px] text-white/50">{t.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md bg-white/5 hover:bg-white/10"><X size={15}/></button>
        </div>

        <div className="flex p-1 gap-1 bg-white/4 rounded-lg mb-3">
          {(['buy','sell'] as const).map(s => (
            <button key={s} onClick={() => setSide(s)}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-display font-bold tracking-wider uppercase ${
                side === s ? (s === 'buy' ? 'btn-up' : 'btn-down') : 'text-white/50'
              }`}>{s}</button>
          ))}
        </div>

        <div className="text-[10px] uppercase tracking-widest text-white/45 mb-1">Amount (ETH)</div>
        <input
          value={amt}
          onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          className="w-full bg-white/4 border border-white/8 hover:border-pink-400/30 focus:border-pink-400/60 transition rounded-lg px-3 py-2.5 font-mono text-lg outline-none"
        />
        <div className="flex items-center gap-1.5 mt-1.5">
          {['0.05','0.1','0.5','1'].map(p => (
            <button key={p} onClick={() => setAmt(p)} className="flex-1 text-[10px] py-1 rounded-md bg-white/3 hover:bg-white/8 font-mono border border-white/5">
              {p} Ξ
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-lg bg-black/40 border border-white/5 p-2.5 text-[11px] font-mono space-y-1">
          <Row k="You pay" v={`${amt || '0'} Ξ ≈ ${formatUsd(usd)}`} />
          <Row k="You receive" v={`${tokens.toLocaleString(undefined,{maximumFractionDigits: 0})} ${t.ticker}`} />
          <Row k="Price impact" v="0.4%" />
          <Row k="Slippage" v="1%" />
        </div>

        <button className={`w-full mt-4 rounded-lg py-3 font-display font-black text-sm tracking-wider uppercase ${
          side === 'buy' ? 'btn-sunset' : 'btn-down'
        }`}>
          {side === 'buy' ? `Buy ${t.ticker}` : `Sell ${t.ticker}`}
        </button>
        <div className="text-[10px] text-white/35 text-center mt-2">Mock launchpad · not financial advice</div>
      </div>
    </div>
  );
}

function LaunchModal({ onClose }: { onClose: () => void }) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-pink-300/90">Sunset Launchpad</div>
            <div className="font-display font-black text-2xl tracking-mega mt-1">Launch a token</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md bg-white/5 hover:bg-white/10"><X size={15}/></button>
        </div>

        <div className="space-y-3">
          <Field label="Ticker" hint="3–6 chars">
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase().slice(0, 6))} placeholder="MIAMI"
              className="w-full bg-white/4 border border-white/8 hover:border-pink-400/30 focus:border-pink-400/60 transition rounded-lg px-3 py-2.5 font-mono outline-none" />
          </Field>
          <Field label="Name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Miami Vice Coin"
              className="w-full bg-white/4 border border-white/8 hover:border-pink-400/30 focus:border-pink-400/60 transition rounded-lg px-3 py-2.5 outline-none" />
          </Field>
          <Field label="Description">
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Tell your degens the vibe…"
              className="w-full bg-white/4 border border-white/8 hover:border-pink-400/30 focus:border-pink-400/60 transition rounded-lg px-3 py-2.5 outline-none resize-none" />
          </Field>
          <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 text-[11px] font-mono space-y-1">
            <Row k="Initial supply" v="1,000,000,000" />
            <Row k="Curve" v="Constant-product · graduates at $69k MC" />
            <Row k="Creator fee" v="1%" />
            <Row k="Network" v="Base" />
          </div>
        </div>

        <button className="w-full mt-5 btn-sunset rounded-lg py-3 font-display font-black text-sm tracking-wider uppercase">
          Deploy token (0.02 Ξ)
        </button>
        <div className="text-[10px] text-white/35 text-center mt-2">Mock UI · no transaction will be submitted.</div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest text-white/45">{label}</span>
        {hint && <span className="text-[10px] text-white/30">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/45">{k}</span>
      <span className="text-white/85">{v}</span>
    </div>
  );
}
