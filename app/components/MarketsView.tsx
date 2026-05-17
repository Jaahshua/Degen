'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, TrendingUp, TrendingDown, Sparkles, Zap, Trophy, ArrowUp } from 'lucide-react';
import { COLLECTIONS, type Collection, generateTrades, formatAgeSec, shortAddr, formatEth } from '../data';
import FeaturedHero from './FeaturedHero';
import TokenCard, { fmtUsd } from './TokenCard';
import TokenSheet from './TokenSheet';
import Spark, { sparkline } from './Spark';

const ETH_USD = 3000;

const FILTERS = [
  { id: 'trending', label: 'Trending', icon: Flame      },
  { id: 'new',      label: 'New',      icon: Sparkles   },
  { id: 'gainers',  label: 'Gainers',  icon: TrendingUp },
  { id: 'top',      label: 'Top Vol',  icon: Trophy     },
] as const;
type FilterId = typeof FILTERS[number]['id'];

function sortCollections(filter: FilterId, list: Collection[]): Collection[] {
  const s = [...list];
  if (filter === 'trending') return s.sort((a, b) => b.volume24h - a.volume24h);
  if (filter === 'new')      return s.sort((a, b) => a.ticker.localeCompare(b.ticker));
  if (filter === 'gainers')  return s.sort((a, b) => b.change24h - a.change24h);
  if (filter === 'top')      return s.sort((a, b) => (b.floor * b.supply) - (a.floor * a.supply));
  return s;
}

export default function MarketsView({ search }: { search: string }) {
  const [filter, setFilter] = useState<FilterId>('trending');
  const [open, setOpen] = useState<Collection | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? COLLECTIONS.filter(c =>
          c.ticker.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q))
      : COLLECTIONS;
    return sortCollections(filter, base);
  }, [filter, search]);

  if (filtered.length === 0) {
    return (
      <div className="px-3 pt-3 pb-32">
        <div className="card p-10 text-center text-white/40 text-sm">No matches.</div>
      </div>
    );
  }

  const featured = filtered[0];
  const grid     = filtered.slice(1, 7);
  const rest     = filtered.slice(7);

  return (
    <div className="px-3 md:px-6 pt-4 pb-32 md:pb-16 max-w-7xl mx-auto">
      {/* FILTER CHIPS */}
      <div className="-mx-3 md:mx-0 px-3 md:px-0 mb-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-display font-bold tracking-wider uppercase transition ${
                active
                  ? 'btn-sunset'
                  : 'bg-white/4 border border-white/8 text-white/70 hover:text-white hover:border-pink-400/30'
              }`}
            >
              <f.icon size={12}/>
              {f.label}
            </button>
          );
        })}
        <span className="shrink-0 ml-auto text-[11px] text-white/35 font-mono">{filtered.length} tokens</span>
      </div>

      {/* FEATURED HERO */}
      <FeaturedHero c={featured} onBuy={() => setOpen(featured)} />

      {/* HOT GRID */}
      <section className="mt-7">
        <SectionHeader
          icon={<Zap size={14}/>}
          title="Hot Right Now"
          right={<button className="text-[11px] uppercase tracking-widest text-white/45 hover:text-white font-mono">See all</button>}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {grid.map(c => (
            <TokenCard key={c.slug} c={c} onTap={() => setOpen(c)} size="md" />
          ))}
        </div>
      </section>

      {/* DENSER LIST */}
      <section className="mt-8">
        <SectionHeader
          icon={<ArrowUp size={14}/>}
          title="More Tokens"
        />
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 text-[9px] uppercase tracking-widest text-white/40 border-b border-white/5">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Token</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">24H</div>
            <div className="col-span-3 text-right">Mkt Cap</div>
          </div>
          {rest.map((c, idx) => (
            <ListRow key={c.slug} c={c} rank={8 + idx} onTap={() => setOpen(c)} />
          ))}
          {rest.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-white/40">That's everything.</div>
          )}
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="mt-8">
        <SectionHeader
          icon={<Flame size={14}/>}
          title="Live Activity"
          right={<span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-up font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-up pulse-dot"/>Streaming
          </span>}
        />
        <LiveActivity collection={featured} />
      </section>

      {open && <TokenSheet c={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SectionHeader({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="flex items-center gap-2 font-display font-black text-xl md:text-2xl tracking-mega">
        <span className="text-sunset">{icon}</span>
        {title}
      </h2>
      {right}
    </div>
  );
}

function ListRow({ c, rank, onTap }: { c: Collection; rank: number; onTap: () => void }) {
  const up = c.change24h >= 0;
  const mc = c.floor * c.supply * ETH_USD;
  const spark = sparkline(c.floor, c.change24h, 18);

  return (
    <button onClick={onTap} className="w-full grid grid-cols-12 items-center px-4 py-3 hover:bg-white/3 transition text-left border-b border-white/3 last:border-0">
      <div className="col-span-1 text-white/40 font-mono text-xs">#{rank}</div>
      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-display font-bold text-xs text-white drop-shadow"
          style={{ background: `linear-gradient(135deg, hsl(${(c.ticker.charCodeAt(0) * 23) % 360} 70% 45%), hsl(${(c.ticker.charCodeAt(1) * 41) % 360} 70% 55%))` }}
        >
          {c.ticker.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-sm leading-none truncate">${c.ticker}</div>
          <div className="text-[11px] text-white/45 truncate mt-0.5">{c.name}</div>
        </div>
      </div>
      <div className="col-span-2 text-right">
        <div className="font-mono text-sm">{c.floor.toFixed(2)} Ξ</div>
        <div className="hidden md:flex justify-end mt-0.5">
          <Spark data={spark} up={up} w={60} h={14} strokeWidth={1.4}/>
        </div>
      </div>
      <div className="col-span-2 text-right">
        <span className={`tag ${up ? 'tag-up' : 'tag-down'}`}>
          {up ? '+' : ''}{c.change24h.toFixed(1)}%
        </span>
      </div>
      <div className="col-span-3 text-right font-mono text-sm text-white/85">{fmtUsd(mc)}</div>
    </button>
  );
}

function LiveActivity({ collection }: { collection: Collection }) {
  const [trades, setTrades] = useState(() => generateTrades(collection.slug, collection.floor, 8));
  useEffect(() => {
    const t = setInterval(() => {
      setTrades(prev => {
        const next = [...prev];
        const head = next[next.length - 1];
        const newT = {
          ...head,
          id: head.id + 1,
          ageSec: 0,
          type: (['BUY','SELL','SWEEP','BID'] as const)[Math.floor(Math.random() * 4)],
          price: collection.floor + (Math.random() - 0.5) * 0.03 * collection.floor,
          amount: 1 + Math.floor(Math.random() * 3),
        };
        return [newT, ...next.slice(0, 7).map(x => ({ ...x, ageSec: x.ageSec + 4 }))];
      });
    }, 4200);
    return () => clearInterval(t);
  }, [collection.floor, collection.slug]);

  return (
    <div className="card overflow-hidden">
      {trades.map((t, idx) => {
        const isUp = t.type === 'BUY' || t.type === 'SWEEP';
        return (
          <div key={`${t.id}-${idx}`}
            className={`grid grid-cols-12 items-center px-4 py-2 border-b border-white/3 last:border-0 ${idx === 0 ? 'fade-in' : ''}`}>
            <div className="col-span-2 md:col-span-1">
              <span className={`tag ${t.type === 'BID' ? 'tag-bid' : isUp ? 'tag-up' : 'tag-down'} !text-[9px]`}>{t.type}</span>
            </div>
            <div className="col-span-5 md:col-span-5 text-xs font-mono text-white/75 truncate">
              {shortAddr(t.maker)} {isUp ? 'bought' : t.type === 'BID' ? 'bid on' : 'sold'} ${collection.ticker}
            </div>
            <div className="hidden md:block col-span-2 text-right font-mono text-xs">{t.amount}x</div>
            <div className={`col-span-3 md:col-span-2 text-right font-mono text-xs ${isUp ? 'text-up' : t.type === 'BID' ? 'text-bid' : 'text-down'}`}>
              {formatEth(t.price * t.amount)} Ξ
            </div>
            <div className="col-span-2 text-right text-[10px] text-white/40 font-mono">{formatAgeSec(t.ageSec)}</div>
          </div>
        );
      })}
    </div>
  );
}
