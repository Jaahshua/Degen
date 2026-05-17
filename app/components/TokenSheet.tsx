'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import { X, ArrowUpRight, ArrowDownRight, Wallet, ExternalLink, Users } from 'lucide-react';
import { type Collection, generateTrades, generateHolders, formatEth, formatAgeSec, shortAddr } from '../data';
import { fmtUsd, tokenPalette } from './TokenCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const ETH_USD = 3000;
const TIMEFRAMES = ['1H', '24H', '7D', '30D'] as const;
type TF = typeof TIMEFRAMES[number];

function series(base: number, tf: TF) {
  const n = tf === '1H' ? 24 : tf === '24H' ? 40 : tf === '7D' ? 48 : 56;
  const vol = tf === '1H' ? 0.018 : tf === '24H' ? 0.06 : tf === '7D' ? 0.11 : 0.18;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const drift = (t - 0.4) * vol * base * 0.6;
    const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9) + Math.sin(i * 0.31) * 0.6) * vol * base * 0.3;
    out.push(base + drift + jitter);
  }
  out.push(base);
  return out;
}

type Tab = 'chart' | 'trades' | 'holders';

export default function TokenSheet({ c, onClose }: { c: Collection; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('chart');
  const [tf, setTf] = useState<TF>('24H');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amt, setAmt] = useState('0.5');
  const [livePrice, setLivePrice] = useState<number | null>(null);

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
  const mcUsd = c.supply * floor * ETH_USD;
  const eth = parseFloat(amt) || 0;
  const items = eth > 0 ? eth / floor : 0;
  const [h1, h2, h3] = tokenPalette(c.ticker);
  const data = series(floor, tf);
  const trades = generateTrades(c.slug, floor, 14);
  const holders = generateHolders(c.slug, c.supply, 10);

  const chart = {
    labels: data.map((_, i) => i),
    datasets: [{
      data,
      borderColor: up ? '#22c55e' : '#ef4444',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
      fill: true,
      backgroundColor: (ctx: any) => {
        const { chart } = ctx;
        if (!chart?.chartArea) return 'rgba(34,197,94,0.1)';
        const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
        if (up) {
          g.addColorStop(0,   'rgba(34, 197, 94, 0.32)');
          g.addColorStop(0.6, 'rgba(34, 197, 94, 0.08)');
          g.addColorStop(1,   'rgba(34, 197, 94, 0.00)');
        } else {
          g.addColorStop(0,   'rgba(239, 68, 68, 0.30)');
          g.addColorStop(0.6, 'rgba(239, 68, 68, 0.08)');
          g.addColorStop(1,   'rgba(239, 68, 68, 0.00)');
        }
        return g;
      },
    }],
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/82 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-2xl md:max-h-[88vh] md:rounded-3xl bg-[#06020e] border-t md:border border-white/8 rounded-t-3xl overflow-hidden slide-up flex flex-col">
        {/* Hero banner */}
        <div
          className="relative px-5 pt-5 pb-6"
          style={{ background: `linear-gradient(135deg, ${h1} 0%, ${h2} 55%, ${h3} 100%)` }}
        >
          <div className="absolute inset-0 overflow-hidden flex items-center justify-end pointer-events-none">
            <span className="font-display font-black tracking-mega text-white/12 leading-none text-[180px] -mr-4 translate-y-3 select-none">
              {c.ticker.slice(0, 6)}
            </span>
          </div>

          {/* Drag handle (mobile) */}
          <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/35" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/85 font-mono">${c.ticker}</div>
              <div className="font-display font-black text-white text-2xl md:text-3xl tracking-tight leading-tight mt-1 truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
                {c.name}
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 p-2 rounded-full bg-black/35 hover:bg-black/50 backdrop-blur" aria-label="Close">
              <X size={16} className="text-white" />
            </button>
          </div>

          <div className="relative flex items-end justify-between mt-4">
            <div>
              <div className="font-mono font-black text-white text-4xl md:text-5xl tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                {formatEth(floor)}<span className="text-xl ml-1 opacity-85">Ξ</span>
              </div>
              <div className={`text-xs font-mono mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                up ? 'bg-emerald-500/35 text-emerald-50' : 'bg-rose-500/35 text-rose-50'
              }`}>
                {up ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                {up ? '+' : ''}{c.change24h.toFixed(2)}% · 24H
                {livePrice && <span className="ml-2 opacity-90">● LIVE</span>}
              </div>
            </div>
            <div className="text-right font-mono text-xs text-white/85">
              <div>MC {fmtUsd(mcUsd)}</div>
              <div className="opacity-80">VOL {c.volume24h.toLocaleString()}Ξ</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/8 px-2">
          {(['chart', 'trades', 'holders'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-display font-bold tracking-[0.18em] uppercase transition ${
                tab === t ? 'text-white border-b-2 border-pink-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pb-32">
          {tab === 'chart' && (
            <div className="p-4 space-y-3">
              <div className="flex gap-1">
                {TIMEFRAMES.map(t => (
                  <button key={t} onClick={() => setTf(t)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-mono tracking-wider transition ${
                      tf === t ? 'bg-pink-500/80 text-white' : 'bg-white/4 text-white/55 hover:bg-white/8'
                    }`}>{t}</button>
                ))}
              </div>
              <div className="h-64 card p-2">
                <Line
                  data={chart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(6,2,14,0.96)',
                        borderColor: 'rgba(255,61,138,0.35)',
                        borderWidth: 1,
                        titleColor: '#fbbf24',
                        bodyColor: '#f8e9d7',
                        padding: 8,
                        displayColors: false,
                        callbacks: { title: () => '', label: (i) => `${(i.parsed.y as number).toFixed(3)} Ξ` },
                      },
                    },
                    interaction: { intersect: false, mode: 'index' },
                    scales: {
                      x: { display: false },
                      y: { position: 'right', grid: { color: 'rgba(255,255,255,0.04)' },
                           ticks: { color: 'rgba(248,233,215,0.4)', font: { family: 'monospace', size: 10 } } },
                    },
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Vol 24H" value={`${c.volume24h.toLocaleString()} Ξ`} />
                <Stat label="Holders" value={c.owners.toLocaleString()} />
                <Stat label="Supply"  value={c.supply.toLocaleString()} />
              </div>
            </div>
          )}

          {tab === 'trades' && (
            <div className="p-4">
              <div className="grid grid-cols-12 px-2 py-2 text-[9px] uppercase tracking-widest text-white/45 border-b border-white/5">
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-3 text-right">Maker</div>
              </div>
              {trades.map(t => {
                const isUp = t.type === 'BUY' || t.type === 'SWEEP';
                return (
                  <div key={t.id} className="grid grid-cols-12 px-2 py-1.5 text-xs font-mono border-b border-white/3 hover:bg-white/3">
                    <div className="col-span-2 text-white/45">{formatAgeSec(t.ageSec)}</div>
                    <div className="col-span-2">
                      <span className={`tag ${t.type === 'BID' ? 'tag-bid' : isUp ? 'tag-up' : 'tag-down'} !text-[9px]`}>{t.type}</span>
                    </div>
                    <div className={`col-span-3 text-right ${isUp ? 'text-up' : t.type === 'BID' ? 'text-bid' : 'text-down'}`}>{formatEth(t.price)}Ξ</div>
                    <div className="col-span-2 text-right text-white/75">{t.amount}</div>
                    <div className="col-span-3 text-right text-white/55 flex items-center justify-end gap-0.5">
                      {shortAddr(t.maker)}<ExternalLink size={9} className="opacity-50"/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'holders' && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50 mb-2">
                <Users size={11}/> Top {holders.length} holders · {c.supply.toLocaleString()} total
              </div>
              {holders.map(h => (
                <div key={h.rank} className="grid grid-cols-12 px-2 py-2 text-xs font-mono border-b border-white/3">
                  <div className="col-span-1 text-white/40">#{h.rank}</div>
                  <div className="col-span-6 text-white/75 flex items-center gap-1">
                    {shortAddr(h.address)}<ExternalLink size={9} className="opacity-50"/>
                  </div>
                  <div className="col-span-2 text-right text-white/65">{h.holds}</div>
                  <div className="col-span-3 text-right text-sunset font-bold">{h.pct.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky trade bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#03010a]/95 backdrop-blur border-t border-white/8 px-4 py-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="flex p-1 gap-1 bg-white/4 rounded-lg mb-2">
            <button onClick={() => setSide('buy')}
              className={`flex-1 py-2 rounded-md text-xs font-display font-bold tracking-wider uppercase ${
                side === 'buy' ? 'btn-up' : 'text-white/55'
              }`}>Buy</button>
            <button onClick={() => setSide('sell')}
              className={`flex-1 py-2 rounded-md text-xs font-display font-bold tracking-wider uppercase ${
                side === 'sell' ? 'btn-down' : 'text-white/55'
              }`}>Sell</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                value={amt}
                onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g, ''))}
                inputMode="decimal"
                className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2.5 font-mono outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/45 font-mono">Ξ</span>
            </div>
            <button className={`shrink-0 px-4 py-2.5 rounded-lg font-display text-sm tracking-wider uppercase ${
              side === 'buy' ? 'btn-sunset' : 'btn-down'
            }`}>
              <Wallet size={14} className="inline mr-1.5 -mt-0.5"/>
              {side === 'buy' ? `Buy ${c.ticker}` : `Sell ${c.ticker}`}
            </button>
          </div>
          <div className="mt-1.5 text-[10px] font-mono text-white/45 text-center">
            ≈ {items.toFixed(3)} {c.ticker} · slip 1% · fee ~0.002 Ξ
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-white/45 font-mono">{label}</div>
      <div className="font-mono text-sm font-bold mt-0.5">{value}</div>
    </div>
  );
}
