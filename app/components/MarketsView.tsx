'use client';

import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Users, BarChart3, Boxes, Flame, ExternalLink, Wallet,
} from 'lucide-react';
import {
  COLLECTIONS, type Collection,
  generateTrades, generateHolders,
  formatEth, formatAgeSec, shortAddr,
} from '../data';
import MobileMarkets from './MobileMarkets';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const TIMEFRAMES = ['1H', '4H', '24H', '7D', '30D'] as const;
type TF = typeof TIMEFRAMES[number];

function seriesFor(base: number, tf: TF) {
  const n = tf === '1H' ? 24 : tf === '4H' ? 32 : tf === '24H' ? 48 : tf === '7D' ? 56 : 60;
  const vol = tf === '1H' ? 0.015 : tf === '4H' ? 0.03 : tf === '24H' ? 0.06 : tf === '7D' ? 0.11 : 0.20;
  const out: number[] = [];
  let p = base * (1 - vol * 0.3);
  for (let i = 0; i < n; i++) {
    const drift = (i / n - 0.4) * vol * base * 0.6;
    const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9) + Math.sin(i * 0.31) * 0.6) * vol * base * 0.3;
    p = base + drift + jitter;
    out.push(p);
  }
  out.push(base);
  return out;
}

function sparkline(base: number, change: number) {
  const n = 18;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const trend = base * (1 - change / 200) + base * (change / 100) * t;
    const noise = Math.sin(i * 1.3 + base) * base * 0.012;
    out.push(trend + noise);
  }
  return out;
}

export default function MarketsView({ search }: { search: string }) {
  const filtered = useMemo<Collection[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COLLECTIONS;
    return COLLECTIONS.filter(c =>
      c.ticker.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q),
    );
  }, [search]);

  const [selected, setSelected] = useState<Collection>(COLLECTIONS[0]);
  const [tf, setTf] = useState<TF>('24H');
  const [livePrice, setLivePrice] = useState<number | null>(null);

  useEffect(() => {
    if (filtered.length && !filtered.find(c => c.slug === selected.slug)) {
      setSelected(filtered[0]);
    }
  }, [filtered, selected.slug]);

  useEffect(() => {
    let cancelled = false;
    setLivePrice(null);
    fetch(`https://api.opensea.io/api/v2/collections/${selected.slug}/stats`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d?.total?.floor_price) setLivePrice(Number(d.total.floor_price));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selected]);

  const floor = livePrice ?? selected.floor;
  const series = useMemo(() => seriesFor(floor, tf), [floor, tf]);
  const up = selected.change24h >= 0;
  const mcap = selected.supply * floor;

  const trades = useMemo(() => generateTrades(selected.slug, floor, 28), [selected.slug, floor]);
  const holders = useMemo(() => generateHolders(selected.slug, selected.supply, 8), [selected.slug, selected.supply]);

  const chartData = {
    labels: series.map((_, i) => i),
    datasets: [{
      data: series,
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
    <>
      {/* Mobile — pump.fun-style list */}
      <div className="md:hidden">
        <MobileMarkets search={search} />
      </div>

      {/* Desktop — 3-column terminal */}
      <div className="hidden md:grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_320px] gap-3 px-3 pt-3">
      {/* ============ LEFT — TRENDING TOKENS ============ */}
      <aside className="term-panel">
        <div className="term-panel-header">
          <span className="flex items-center gap-1.5"><Flame size={11} className="text-pink-400"/> Trending</span>
          <span className="text-[10px] text-white/30">24H</span>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
          {filtered.length === 0 && <div className="p-6 text-center text-xs text-white/40">No matches.</div>}
          {filtered.map((c, idx) => {
            const active = c.slug === selected.slug;
            const cUp = c.change24h >= 0;
            const spark = sparkline(c.floor, c.change24h);
            return (
              <button
                key={c.slug}
                onClick={() => setSelected(c)}
                className={`row-hover w-full text-left px-3 py-2.5 border-l-2 transition ${
                  active ? 'bg-white/4 border-pink-400' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 text-[10px] text-white/35 font-mono">#{idx + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-bold text-sm leading-none">{c.ticker}</span>
                      <span className="text-[10px] text-white/40 truncate">{c.name}</span>
                    </div>
                    <div className="font-mono text-[11px] text-white/55 mt-0.5">{formatEth(c.floor)} Ξ</div>
                  </div>
                  <Spark data={spark} up={cUp} w={36} h={18} />
                  <div className={`font-mono text-[11px] w-12 text-right ${cUp ? 'text-up' : 'text-down'}`}>
                    {cUp ? '+' : ''}{c.change24h.toFixed(1)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ============ CENTER — CHART + RECENT TRADES ============ */}
      <section className="space-y-3 min-w-0">
        {/* Header banner */}
        <div className="term-panel px-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-white font-display font-bold tracking-tight"
                style={{ background: `linear-gradient(135deg, hsl(${(selected.ticker.charCodeAt(0) * 23) % 360} 70% 45%), hsl(${(selected.ticker.charCodeAt(1) * 41) % 360} 70% 55%))` }}
              >
                {selected.ticker.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-bold tracking-tight leading-none">${selected.ticker}</span>
                  <span className="text-xs text-white/45 truncate">{selected.name}</span>
                  {livePrice && <span className="tag tag-up !text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-up blink"/>LIVE</span>}
                </div>
                <div className="flex items-center gap-3 mt-1.5 font-mono text-xs text-white/50">
                  <span>CA: {shortAddr('0x' + selected.slug.padEnd(40, '0').slice(0, 40))}</span>
                  <span className="text-white/25">·</span>
                  <span>ERC-721</span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="font-mono text-3xl font-bold tracking-tight">{formatEth(floor)} <span className="text-base text-white/55">Ξ</span></div>
              <span className={`tag ${up ? 'tag-up' : 'tag-down'} text-sm !px-2 !py-1`}>
                {up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                {up ? '+' : ''}{selected.change24h.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-2 mt-4 text-xs">
            <Stat label="Mkt Cap" value={`${(mcap / 1000).toFixed(1)}K Ξ`} />
            <Stat label="Volume 24H" value={`${selected.volume24h.toLocaleString()} Ξ`} />
            <Stat label="Holders" value={selected.owners.toLocaleString()} />
            <Stat label="Supply" value={selected.supply.toLocaleString()} />
            <Stat label="Listed" value={`${Math.round(selected.supply * 0.064).toLocaleString()} · ${(6.4).toFixed(1)}%`} />
          </div>
        </div>

        {/* Chart */}
        <div className="term-panel">
          <div className="term-panel-header">
            <span>Price · Floor (Ξ)</span>
            <div className="flex items-center gap-0.5">
              {TIMEFRAMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTf(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider transition ${
                    tf === t ? 'bg-pink-500/80 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 h-[360px]">
            <Line
              data={chartData}
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
                    padding: 10,
                    displayColors: false,
                    callbacks: { title: () => '', label: (i) => `${(i.parsed.y as number).toFixed(3)} Ξ` },
                  },
                },
                interaction: { intersect: false, mode: 'index' },
                scales: {
                  x: { display: false },
                  y: {
                    position: 'right',
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: 'rgba(236,230,216,0.4)', font: { family: 'monospace', size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Recent trades */}
        <div className="term-panel">
          <div className="term-panel-header">
            <span>Recent Trades</span>
            <span className="text-[10px] text-white/30">{trades.length} txs</span>
          </div>
          <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Price (Ξ)</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Total (Ξ)</div>
            <div className="col-span-3 text-right">Maker</div>
          </div>
          <div className="max-h-[340px] overflow-y-auto">
            {trades.map(t => {
              const isUp = t.type === 'BUY' || t.type === 'SWEEP';
              return (
                <div key={t.id} className="row-hover grid grid-cols-12 px-3 py-1.5 text-xs font-mono border-b border-white/3 last:border-0">
                  <div className="col-span-2 text-white/45">{formatAgeSec(t.ageSec)}</div>
                  <div className="col-span-2">
                    <span className={`tag ${
                      t.type === 'BID' ? 'tag-bid' :
                      isUp             ? 'tag-up'  : 'tag-down'
                    }`}>{t.type}</span>
                  </div>
                  <div className={`col-span-2 text-right ${isUp ? 'text-up' : t.type === 'BID' ? 'text-bid' : 'text-down'}`}>{formatEth(t.price)}</div>
                  <div className="col-span-1 text-right text-white/75">{t.amount}</div>
                  <div className="col-span-2 text-right text-white/75">{formatEth(t.price * t.amount)}</div>
                  <div className="col-span-3 text-right text-white/55 flex items-center justify-end gap-1">
                    <span>{shortAddr(t.maker)}</span>
                    <ExternalLink size={10} className="opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ RIGHT — TRADE + HOLDERS ============ */}
      <aside className="space-y-3">
        <TradePanel ticker={selected.ticker} floor={floor} />
        <HoldersPanel holders={holders} totalSupply={selected.supply} />
      </aside>
      </div>
    </>
  );
}

/* ============ Subcomponents ============ */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="font-mono text-sm mt-0.5">{value}</div>
    </div>
  );
}

function Spark({ data, up, w = 60, h = 20 }: { data: number[]; up: boolean; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = up ? '#10c87c' : '#ef4444';
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth={1.4} points={pts} />
    </svg>
  );
}

function TradePanel({ ticker, floor }: { ticker: string; floor: number }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amt, setAmt] = useState('0.5');
  const [slip, setSlip] = useState('1');
  const eth = parseFloat(amt) || 0;
  const items = eth > 0 ? eth / floor : 0;

  return (
    <div className="term-panel">
      <div className="flex p-1 gap-1">
        <button onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded text-xs font-display font-bold tracking-wider uppercase transition ${
            side === 'buy' ? 'btn-up' : 'text-white/55 hover:bg-white/5'
          }`}>Buy</button>
        <button onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded text-xs font-display font-bold tracking-wider uppercase transition ${
            side === 'sell' ? 'btn-down' : 'text-white/55 hover:bg-white/5'
          }`}>Sell</button>
      </div>

      <div className="px-3 pb-3 space-y-3">
        <div>
          <div className="flex items-baseline justify-between text-[10px] uppercase tracking-widest text-white/45 mb-1">
            <span>Amount</span><span>ETH</span>
          </div>
          <input
            value={amt}
            onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            className="w-full bg-white/4 border border-white/8 hover:border-pink-400/30 focus:border-pink-400/60 transition rounded-lg px-3 py-2.5 font-mono text-lg outline-none"
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            {['0.1','0.5','1','5'].map(p => (
              <button key={p} onClick={() => setAmt(p)}
                className="flex-1 text-[10px] py-1 rounded-md bg-white/3 hover:bg-white/8 font-mono border border-white/5">
                {p} Ξ
              </button>
            ))}
            <button onClick={() => setAmt('10')}
              className="flex-1 text-[10px] py-1 rounded-md bg-white/3 hover:bg-white/8 font-mono border border-white/5">
              MAX
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-black/35 border border-white/5 p-2.5 text-[11px] font-mono space-y-1">
          <Row k="You receive" v={`${items.toFixed(3)} ${ticker}`} />
          <Row k="Avg fill" v={`${formatEth(floor)} Ξ`} />
          <Row k="Slippage" v={`${slip}%`} />
          <Row k="Network fee" v="~0.002 Ξ" />
        </div>

        <div className="flex items-center gap-1.5">
          {['0.5', '1', '2', '5'].map(s => (
            <button key={s} onClick={() => setSlip(s)}
              className={`flex-1 text-[10px] py-1 rounded-md font-mono border ${
                slip === s ? 'bg-pink-500/15 border-pink-400/50 text-pink-200' : 'bg-white/3 border-white/5 text-white/55 hover:bg-white/8'
              }`}>
              {s}% slip
            </button>
          ))}
        </div>

        <button className={`w-full rounded-lg py-3 font-display text-base tracking-wider uppercase pulse-glow ${
          side === 'buy' ? 'btn-sunset' : 'btn-down'
        }`}>
          <Wallet size={14} className="inline mr-2 -mt-0.5"/>
          {side === 'buy' ? `Buy ${ticker}` : `Sell ${ticker}`}
        </button>

        <button className="w-full text-[10px] py-2 rounded-md btn-ghost font-mono tracking-wider uppercase">
          Sweep Floor · {formatEth(floor)} Ξ
        </button>
      </div>
    </div>
  );
}

function HoldersPanel({ holders, totalSupply }: { holders: any[]; totalSupply: number }) {
  return (
    <div className="term-panel">
      <div className="term-panel-header">
        <span className="flex items-center gap-1.5"><Users size={11}/> Top Holders</span>
        <span className="text-[10px] text-white/30">{totalSupply.toLocaleString()} supply</span>
      </div>
      <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
        <div className="col-span-1">#</div>
        <div className="col-span-6">Wallet</div>
        <div className="col-span-2 text-right">Holds</div>
        <div className="col-span-3 text-right">%</div>
      </div>
      {holders.map(h => (
        <div key={h.rank} className="row-hover grid grid-cols-12 px-3 py-1.5 text-xs font-mono border-b border-white/3 last:border-0">
          <div className="col-span-1 text-white/35">{h.rank}</div>
          <div className="col-span-6 text-white/70 flex items-center gap-1">
            <span>{shortAddr(h.address)}</span>
            <ExternalLink size={9} className="opacity-50" />
          </div>
          <div className="col-span-2 text-right text-white/75">{h.holds}</div>
          <div className="col-span-3 text-right">
            <span className="text-sunset">{h.pct.toFixed(2)}%</span>
          </div>
        </div>
      ))}
    </div>
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
