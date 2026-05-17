'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import { X, ArrowUpRight, ArrowDownRight, Wallet, ExternalLink } from 'lucide-react';
import { type Collection, generateTrades, formatEth, formatAgeSec, shortAddr } from '../data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const TIMEFRAMES = ['1H', '24H', '7D', '30D'] as const;
type TF = typeof TIMEFRAMES[number];

function series(base: number, tf: TF) {
  const n = tf === '1H' ? 24 : tf === '24H' ? 36 : tf === '7D' ? 42 : 48;
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

export default function MobileTokenSheet({ c, onClose }: { c: Collection; onClose: () => void }) {
  const [tf, setTf] = useState<TF>('24H');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amt, setAmt] = useState('0.5');
  const [livePrice, setLivePrice] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.opensea.io/api/v2/collections/${c.slug}/stats`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d?.total?.floor_price) setLivePrice(Number(d.total.floor_price));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [c.slug]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const floor = livePrice ?? c.floor;
  const up = c.change24h >= 0;
  const eth = parseFloat(amt) || 0;
  const items = eth > 0 ? eth / floor : 0;
  const trades = generateTrades(c.slug, floor, 8);

  const data = series(floor, tf);
  const chart = {
    labels: data.map((_, i) => i),
    datasets: [{
      data,
      borderColor: up ? '#10c87c' : '#ef4444',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
      fill: true,
      backgroundColor: (ctx: any) => {
        const { chart } = ctx;
        if (!chart?.chartArea) return 'rgba(16,200,124,0.1)';
        const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
        if (up) {
          g.addColorStop(0,   'rgba(16, 200, 124, 0.32)');
          g.addColorStop(0.6, 'rgba(16, 200, 124, 0.08)');
          g.addColorStop(1,   'rgba(16, 200, 124, 0.00)');
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
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-6 bg-[#08050f] border-t border-white/10 rounded-t-3xl overflow-y-auto animate-[slideUp_0.3s_ease-out]">
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#08050f]/95 backdrop-blur border-b border-white/5">
          <div className="w-10 h-1 rounded-full bg-white/15 absolute left-1/2 -translate-x-1/2 top-1.5" />
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, hsl(${(c.ticker.charCodeAt(0) * 23) % 360} 70% 45%), hsl(${(c.ticker.charCodeAt(1) * 41) % 360} 70% 55%))` }}
            >
              <span className="text-white font-display font-bold text-sm">{c.ticker.slice(0, 2)}</span>
            </div>
            <div>
              <div className="font-display font-bold tracking-tight leading-none">${c.ticker}</div>
              <div className="text-[10px] text-white/45 truncate max-w-[180px]">{c.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/8 hover:bg-white/15" aria-label="Close">
            <X size={16}/>
          </button>
        </div>

        <div className="px-4 pt-4 pb-32">
          {/* Price banner */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="font-mono text-3xl font-bold leading-none">{formatEth(floor)} <span className="text-base text-white/55">Ξ</span></div>
              <div className={`flex items-center gap-1 mt-1 text-xs font-mono ${up ? 'text-up' : 'text-down'}`}>
                {up ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
                {up ? '+' : ''}{c.change24h.toFixed(2)}% · 24H
                {livePrice && <span className="ml-2 text-up/70">● LIVE</span>}
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="text-white/45">MC</div>
              <div>{((c.supply * floor) / 1000).toFixed(1)}K Ξ</div>
            </div>
          </div>

          {/* Timeframes */}
          <div className="flex gap-1 mb-2">
            {TIMEFRAMES.map(t => (
              <button key={t} onClick={() => setTf(t)}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-mono tracking-wider transition ${
                  tf === t ? 'bg-pink-500/80 text-white' : 'bg-white/4 text-white/55'
                }`}>{t}</button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-56 term-panel p-2">
            <Line
              data={chart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(8,5,16,0.96)',
                    borderColor: 'rgba(255,122,155,0.35)',
                    borderWidth: 1,
                    titleColor: '#fdb869',
                    bodyColor: '#ece6d8',
                    padding: 8,
                    displayColors: false,
                    callbacks: { title: () => '', label: (i) => `${(i.parsed.y as number).toFixed(3)} Ξ` },
                  },
                },
                interaction: { intersect: false, mode: 'index' },
                scales: {
                  x: { display: false },
                  y: { position: 'right', grid: { color: 'rgba(255,255,255,0.04)' },
                       ticks: { color: 'rgba(236,230,216,0.4)', font: { family: 'monospace', size: 9 } } },
                },
              }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <Stat label="Vol 24H" value={`${c.volume24h} Ξ`} />
            <Stat label="Holders" value={c.owners.toLocaleString()} />
            <Stat label="Supply"  value={c.supply.toLocaleString()} />
          </div>

          {/* Recent trades */}
          <div className="mt-4 term-panel">
            <div className="term-panel-header"><span>Recent Trades</span></div>
            {trades.slice(0, 6).map(t => {
              const isUp = t.type === 'BUY' || t.type === 'SWEEP';
              return (
                <div key={t.id} className="flex items-center justify-between px-3 py-1.5 text-xs font-mono border-b border-white/3 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`tag ${t.type === 'BID' ? 'tag-bid' : isUp ? 'tag-up' : 'tag-down'} !text-[9px]`}>{t.type}</span>
                    <span className="text-white/45 shrink-0">{formatAgeSec(t.ageSec)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className={isUp ? 'text-up' : t.type === 'BID' ? 'text-bid' : 'text-down'}>{formatEth(t.price)}Ξ</span>
                    <span className="text-white/55 w-12 text-right truncate flex items-center justify-end gap-0.5">
                      {shortAddr(t.maker)}<ExternalLink size={9} className="opacity-50"/>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky buy/sell at bottom */}
        <div className="fixed inset-x-0 bottom-0 z-20 bg-[#05030a]/95 backdrop-blur border-t border-white/8 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
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
    <div className="rounded-lg bg-white/3 border border-white/5 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-widest text-white/45">{label}</div>
      <div className="font-mono mt-0.5">{value}</div>
    </div>
  );
}
