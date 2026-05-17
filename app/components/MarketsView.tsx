'use client';

import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Users, BarChart3, Boxes } from 'lucide-react';
import { COLLECTIONS, type Collection } from '../data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const TIMEFRAMES = ['1H', '4H', '24H', '7D', '30D'] as const;
type TF = typeof TIMEFRAMES[number];

function seriesFor(base: number, tf: TF) {
  const n = tf === '1H' ? 12 : tf === '4H' ? 16 : tf === '24H' ? 24 : tf === '7D' ? 28 : 30;
  const vol = tf === '1H' ? 0.015 : tf === '4H' ? 0.03 : tf === '24H' ? 0.05 : tf === '7D' ? 0.09 : 0.18;
  const out: number[] = [];
  let p = base;
  for (let i = 0; i < n; i++) {
    const drift = (i / n - 0.4) * vol * base * 0.6;
    const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * vol * base * 0.5;
    p = base + drift + jitter;
    out.push(p);
  }
  out.push(base);
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
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!cancelled && d?.total?.floor_price) setLivePrice(Number(d.total.floor_price));
      })
      .catch(() => { /* fall back to mock */ });
    return () => { cancelled = true; };
  }, [selected]);

  const floor = livePrice ?? selected.floor;
  const series = useMemo(() => seriesFor(floor, tf), [floor, tf]);
  const up = selected.change24h >= 0;

  const chartData = {
    labels: series.map((_, i) => i),
    datasets: [{
      data: series,
      borderColor: '#ff7a9b',
      borderWidth: 2.5,
      pointRadius: 0,
      tension: 0.45,
      fill: true,
      backgroundColor: (ctx: any) => {
        const { chart } = ctx;
        if (!chart?.chartArea) return 'rgba(255,122,155,0.15)';
        const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
        g.addColorStop(0,   'rgba(253, 184, 105, 0.40)');
        g.addColorStop(0.5, 'rgba(255, 122, 155, 0.22)');
        g.addColorStop(1,   'rgba(91,  44,  142, 0.00)');
        return g;
      },
    }],
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pr-[60px]">
      {/* SIDEBAR */}
      <aside className="lg:w-[320px] shrink-0">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-pink-300 mb-3">
            <BarChart3 size={16} />
            <span className="text-[11px] tracking-[0.22em] uppercase">High Volume</span>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <div className="text-sm text-white/40 px-2 py-6 text-center">No matches.</div>
            )}
            {filtered.map(c => {
              const active = c.slug === selected.slug;
              return (
                <button
                  key={c.slug}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    active
                      ? 'bg-gradient-to-r from-pink-500/20 to-orange-400/10 border-pink-400/50'
                      : 'bg-white/3 border-white/8 hover:border-pink-400/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display font-bold text-lg leading-none">{c.ticker}</div>
                      <div className="text-xs text-white/55 mt-1">{c.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{c.floor.toFixed(2)} Ξ</div>
                      <div className={`text-xs font-mono flex items-center justify-end gap-0.5 ${c.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.change24h >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                        {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 space-y-5">
        <div className="card-glow paper-texture relative p-7 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-pink-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-purple-700/20 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="text-[11px] tracking-[0.22em] uppercase text-pink-300/80 mb-1">Now Trading</div>
              <div className="font-display text-6xl md:text-7xl font-bold tracking-tight leading-none">
                {selected.ticker}
              </div>
              <div className="text-sunset font-display text-xl mt-2 tracking-tight">{selected.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-5xl md:text-6xl text-sunset font-bold tracking-tight">
                {floor.toFixed(2)} <span className="text-2xl md:text-3xl opacity-80">Ξ</span>
              </div>
              <div className={`flex items-center justify-end gap-1 mt-1 ${up ? 'text-emerald-400' : 'text-rose-400'} font-mono`}>
                {up ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                {up ? '+' : ''}{selected.change24h.toFixed(2)}% · 24H
                {livePrice && <span className="ml-2 text-emerald-300/70 text-xs">● LIVE</span>}
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-1.5 mb-3">
            {TIMEFRAMES.map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition ${
                  tf === t ? 'bg-pink-500/80 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative h-[340px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15,6,30,0.95)',
                    borderColor: 'rgba(255,122,155,0.4)',
                    borderWidth: 1,
                    titleColor: '#fdb869',
                    bodyColor: '#f5e6d3',
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                      title: () => '',
                      label: (i) => `${(i.parsed.y as number).toFixed(3)} Ξ`,
                    },
                  },
                },
                interaction: { intersect: false, mode: 'index' },
                scales: {
                  x: { display: false },
                  y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: 'rgba(245,230,211,0.45)', font: { family: 'monospace', size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Volume 24H" value={`${selected.volume24h.toLocaleString()} Ξ`} icon={<BarChart3 size={16}/>} />
          <Stat label="Owners" value={selected.owners.toLocaleString()} icon={<Users size={16}/>} />
          <Stat label="Supply" value={selected.supply.toLocaleString()} icon={<Boxes size={16}/>} />
          <Stat label="Market Cap" value={`${(selected.supply * floor / 1000).toFixed(1)}K Ξ`} icon={<TrendingUp size={16}/>} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button className="btn-sunset rounded-2xl px-8 py-5 text-lg font-display tracking-tight flex-1 pulse-glow">
            SWEEP FLOOR · {floor.toFixed(2)} Ξ
          </button>
          <button className="btn-ghost rounded-2xl px-8 py-5 text-lg font-display tracking-tight flex-1">
            PLACE BID
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center gap-2 text-pink-300/80 text-[10px] uppercase tracking-[0.18em] mb-1.5">
        {icon}
        {label}
      </div>
      <div className="font-mono text-lg">{value}</div>
    </div>
  );
}
