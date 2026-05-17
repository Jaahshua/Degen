'use client';

import { useEffect, useMemo, useState } from 'react';
import { Rocket, Flame, Sparkles, X, ArrowUpRight, ArrowDownRight, Users, Clock } from 'lucide-react';
import { LAUNCH_TOKENS, formatUsd, formatAge, type LaunchToken } from '../data';

const FILTERS = [
  { id: 'new',  label: 'NEW',  icon: Sparkles },
  { id: 'hot',  label: 'HOT',  icon: Flame    },
  { id: 'near', label: 'NEAR GRADUATION', icon: Rocket },
] as const;

type FilterId = typeof FILTERS[number]['id'];

function BondingCurve({ pct, hue1, hue2 }: { pct: number; hue1: string; hue2: string }) {
  // simple bondingCurve preview: cubic that grows steeply at the end
  const points = Array.from({ length: 24 }, (_, i) => {
    const x = i / 23;
    const y = 1 - Math.pow(x, 2.5);
    return [x * 100, y * 100] as const;
  });
  const fillPct = Math.min(100, Math.max(0, pct));
  const id = `g-${hue1.slice(1)}-${hue2.slice(1)}`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-14">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={hue1} />
          <stop offset="100%" stopColor={hue2} />
        </linearGradient>
      </defs>
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.2"
      />
      <rect x="0" y="92" width={fillPct} height="6" fill={`url(#${id})`} rx="2" />
      <rect x="0" y="92" width="100" height="6" fill="rgba(255,255,255,0.08)" rx="2" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
}

export default function LaunchpadView({ search }: { search: string }) {
  const [filter, setFilter] = useState<FilterId>('new');
  const [buyToken, setBuyToken] = useState<LaunchToken | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);

  const tokens = useMemo<LaunchToken[]>(() => {
    const q = search.trim().toLowerCase();
    let list = LAUNCH_TOKENS;
    if (q) list = list.filter(t =>
      t.ticker.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q),
    );
    const sorted = [...list];
    if (filter === 'new')  sorted.sort((a, b) => a.ageMin - b.ageMin);
    if (filter === 'hot')  sorted.sort((a, b) => b.change24h - a.change24h);
    if (filter === 'near') sorted.sort((a, b) => b.bondingPct - a.bondingPct);
    return sorted;
  }, [search, filter]);

  return (
    <div className="space-y-6 pr-[60px]">
      <div className="card-glow paper-texture relative overflow-hidden p-6 md:p-8">
        <div className="absolute -top-32 -right-20 w-[380px] h-[380px] rounded-full bg-orange-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-10 w-[320px] h-[320px] rounded-full bg-purple-600/30 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-pink-300/90 text-[11px] uppercase tracking-[0.22em] mb-2">
              <Rocket size={13}/> Sunset Launchpad
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Launch &amp; trade <span className="text-sunset">meme coins</span>
            </h1>
            <p className="text-white/60 mt-2 max-w-md">
              Anyone can launch a token on a bonding curve. Buy early, sell into momentum, graduate to mainnet.
            </p>
          </div>
          <button
            onClick={() => setLaunchOpen(true)}
            className="btn-sunset rounded-2xl px-6 py-4 font-display text-lg tracking-tight flex items-center gap-2 self-start pulse-glow"
          >
            <Rocket size={18}/> LAUNCH NEW TOKEN
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {FILTERS.map(f => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display tracking-tight transition ${
                  active ? 'btn-sunset' : 'btn-ghost'
                }`}
              >
                <f.icon size={14} />
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-white/40 font-mono">{tokens.length} live tokens</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map(t => (
          <TokenCard key={t.id} t={t} onBuy={() => setBuyToken(t)} />
        ))}
        {tokens.length === 0 && (
          <div className="col-span-full card p-10 text-center text-white/40">No tokens match.</div>
        )}
      </div>

      {buyToken && <BuyModal t={buyToken} onClose={() => setBuyToken(null)} />}
      {launchOpen && <LaunchModal onClose={() => setLaunchOpen(false)} />}
    </div>
  );
}

function TokenCard({ t, onBuy }: { t: LaunchToken; onBuy: () => void }) {
  const up = t.change24h >= 0;
  return (
    <div className="card paper-texture relative overflow-hidden p-4 hover:border-pink-400/40 transition group">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl shrink-0 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${t.hue1}, ${t.hue2})` }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white font-display font-bold text-lg drop-shadow">
            {t.ticker.slice(0, 2)}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold tracking-tight truncate">{t.ticker}</span>
            <span className="text-[10px] text-white/40 font-mono shrink-0 flex items-center gap-1">
              <Clock size={10}/>{formatAge(t.ageMin)}
            </span>
          </div>
          <div className="text-xs text-white/55 truncate">{t.name}</div>
        </div>
        <div className={`text-right font-mono shrink-0 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
          <div className="flex items-center gap-0.5 text-sm justify-end">
            {up ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
            {up ? '+' : ''}{t.change24h.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/45">Price</div>
          <div>{formatUsd(t.priceUsd)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/45">MC</div>
          <div>{formatUsd(t.marketcap)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/45">Holders</div>
          <div className="flex items-center gap-1"><Users size={10}/>{t.holders}</div>
        </div>
      </div>

      <div className="mt-3">
        <BondingCurve pct={t.bondingPct} hue1={t.hue1} hue2={t.hue2} />
        <div className="flex items-center justify-between text-[10px] mt-1">
          <span className="text-white/40 uppercase tracking-widest">Bonding</span>
          <span className="font-mono text-sunset">{t.bondingPct}%</span>
        </div>
      </div>

      <button
        onClick={onBuy}
        className="btn-sunset w-full mt-4 rounded-xl py-2.5 text-sm font-display tracking-tight"
      >
        BUY {t.ticker}
      </button>
    </div>
  );
}

function BuyModal({ t, onClose }: { t: LaunchToken; onClose: () => void }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amt, setAmt] = useState('0.1');

  const ethUsd = 2400;
  const usd = (parseFloat(amt) || 0) * ethUsd;
  const tokensReceived = usd / t.priceUsd;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card-glow paper-texture p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${t.hue1}, ${t.hue2})` }} />
            <div>
              <div className="font-display font-bold tracking-tight">{t.ticker}</div>
              <div className="text-xs text-white/55">{t.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
            <X size={16}/>
          </button>
        </div>

        <div className="flex bg-white/5 rounded-xl p-1 mb-4">
          {(['buy','sell'] as const).map(s => (
            <button key={s} onClick={() => setSide(s)}
              className={`flex-1 py-2 rounded-lg text-sm font-display tracking-tight uppercase ${side===s ? (s==='buy' ? 'btn-sunset' : 'bg-rose-500 text-white') : 'text-white/55'}`}>
              {s}
            </button>
          ))}
        </div>

        <label className="text-[10px] uppercase tracking-widest text-white/55">Amount (ETH)</label>
        <input
          value={amt}
          onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g,''))}
          inputMode="decimal"
          className="w-full bg-white/5 border border-white/10 hover:border-pink-400/30 focus:border-pink-400/70 transition rounded-xl px-3 py-3 mt-1 font-mono text-lg outline-none"
        />
        <div className="flex items-center gap-2 mt-2">
          {['0.05','0.1','0.5','1'].map(p => (
            <button key={p} onClick={() => setAmt(p)} className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 font-mono">{p} Ξ</button>
          ))}
        </div>

        <div className="mt-4 bg-black/30 rounded-xl p-3 text-sm font-mono space-y-1.5">
          <Row k="You pay" v={`${amt || '0'} Ξ  ≈  ${formatUsd(usd)}`} />
          <Row k="You receive" v={`${tokensReceived.toLocaleString(undefined,{maximumFractionDigits: 0})} ${t.ticker}`} />
          <Row k="Price impact" v="0.4%" />
          <Row k="Slippage" v="1%" />
        </div>

        <button className={`w-full mt-5 rounded-xl py-3.5 font-display text-lg tracking-tight ${side==='buy' ? 'btn-sunset' : 'bg-rose-500 hover:bg-rose-400 text-white'}`}>
          {side === 'buy' ? `BUY ${t.ticker}` : `SELL ${t.ticker}`}
        </button>
        <div className="text-[10px] text-white/40 text-center mt-3">Mock launchpad · not financial advice</div>
      </div>
    </div>
  );
}

function LaunchModal({ onClose }: { onClose: () => void }) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card-glow paper-texture p-7 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-pink-300/90">Sunset Launchpad</div>
            <div className="font-display text-2xl font-bold tracking-tight mt-1">Launch a token</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
            <X size={16}/>
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Ticker" hint="3–6 chars">
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase().slice(0,6))}
              placeholder="MIAMI"
              className="w-full bg-white/5 border border-white/10 hover:border-pink-400/30 focus:border-pink-400/70 transition rounded-xl px-3 py-3 font-mono outline-none" />
          </Field>
          <Field label="Name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Miami Vice Coin"
              className="w-full bg-white/5 border border-white/10 hover:border-pink-400/30 focus:border-pink-400/70 transition rounded-xl px-3 py-3 outline-none" />
          </Field>
          <Field label="Description">
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Tell your degens the vibe…"
              className="w-full bg-white/5 border border-white/10 hover:border-pink-400/30 focus:border-pink-400/70 transition rounded-xl px-3 py-3 outline-none resize-none" />
          </Field>
          <div className="bg-black/30 rounded-xl p-3 text-xs font-mono space-y-1.5">
            <Row k="Initial supply" v="1,000,000,000" />
            <Row k="Curve" v="Constant-product · graduates at $69k MC" />
            <Row k="Creator fee" v="1%" />
            <Row k="Network" v="Base" />
          </div>
        </div>

        <button className="w-full mt-6 btn-sunset rounded-xl py-3.5 font-display text-lg tracking-tight">
          DEPLOY TOKEN (0.02 Ξ)
        </button>
        <div className="text-[10px] text-white/40 text-center mt-3">Mock UI · no transaction will be submitted.</div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest text-white/55">{label}</span>
        {hint && <span className="text-[10px] text-white/35">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{k}</span>
      <span>{v}</span>
    </div>
  );
}
