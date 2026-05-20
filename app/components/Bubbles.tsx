'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon, X, ShieldAlert, Network as NetworkIcon, Info, ExternalLink } from 'lucide-react';
import {
  COLLECTIONS, fetchOpenSeaCollection, searchOpenSea,
  generateBubbleMap, layoutBubbles,
  type Collection, type Wallet, shortAddr,
} from '../data';
import Thumb from './Thumb';

const CLUSTER_NAMES = ['', 'DEV-LINKED', 'INSIDERS', 'WHALES'];
const CLUSTER_COLORS = [
  '#9ca3af', // standalone gray
  '#ef4444', // dev red
  '#fbbf24', // insiders amber
  '#a855f7', // whales purple
];

function pct(n: number, total: number) {
  return total > 0 ? (n / total) * 100 : 0;
}

function riskScore(wallets: Wallet[], supply: number): { score: number; label: string; color: string } {
  if (!wallets.length) return { score: 0, label: 'UNKNOWN', color: '#9ca3af' };
  const top = wallets[0].holdings / supply * 100;
  const top10 = wallets.slice(0, 10).reduce((s, w) => s + w.holdings, 0) / supply * 100;
  const inClusters = wallets.filter(w => w.cluster > 0).reduce((s, w) => s + w.holdings, 0) / supply * 100;

  let score = 0;
  score += Math.min(40, top * 6);
  score += Math.min(30, top10 * 0.8);
  score += Math.min(30, inClusters * 1.2);
  score = Math.min(100, Math.round(score));

  if (score < 25)  return { score, label: 'LOW RISK',    color: '#22c55e' };
  if (score < 50)  return { score, label: 'WATCH',       color: '#fbbf24' };
  if (score < 75)  return { score, label: 'HIGH RISK',   color: '#f97316' };
  return                  { score, label: 'CRITICAL',     color: '#ef4444' };
}

type Level = 'danger' | 'warn' | 'good';
type Signal = { level: Level; text: string };
const LEVEL_COLOR: Record<Level, string> = { danger: '#ef4444', warn: '#fbbf24', good: '#22c55e' };

/** Plain-language read of the wallet distribution + momentum. */
function computeSignals(wallets: Wallet[], supply: number, change24h: number): Signal[] {
  const out: Signal[] = [];
  if (!wallets.length) return out;

  const top = wallets[0].holdings / supply * 100;
  const top10 = wallets.slice(0, 10).reduce((s, w) => s + w.holdings, 0) / supply * 100;
  const clusterWallets = wallets.filter(w => w.cluster > 0);
  const clusterHold = clusterWallets.reduce((s, w) => s + w.holdings, 0) / supply * 100;
  const clusterCount = clusterWallets.length;

  // Single-whale dump risk
  if (top >= 15)      out.push({ level: 'danger', text: `One wallet holds ${top.toFixed(0)}% — it could dump the floor` });
  else if (top >= 8)  out.push({ level: 'warn',   text: `Top wallet holds ${top.toFixed(0)}% — watch for a dump` });
  else                out.push({ level: 'good',   text: `No whale — biggest wallet is only ${top.toFixed(1)}%` });

  // Concentration
  if (top10 >= 60)      out.push({ level: 'danger', text: `Top 10 wallets hold ${top10.toFixed(0)}% — very concentrated` });
  else if (top10 >= 40) out.push({ level: 'warn',   text: `Top 10 hold ${top10.toFixed(0)}% — somewhat concentrated` });
  else                  out.push({ level: 'good',   text: `Top 10 hold ${top10.toFixed(0)}% — well spread out` });

  // Linked clusters (insider / sybil)
  if (clusterHold >= 18)      out.push({ level: 'danger', text: `${clusterCount} linked wallets hold ${clusterHold.toFixed(0)}% — likely insiders` });
  else if (clusterHold >= 8)  out.push({ level: 'warn',   text: `${clusterCount} linked wallets hold ${clusterHold.toFixed(0)}%` });
  else                        out.push({ level: 'good',   text: `Few linked wallets — looks organic` });

  // Momentum (pump / dump)
  if (change24h >= 25)       out.push({ level: 'good',   text: `Volume +${change24h.toFixed(0)}% (24h) — heating up 🔥` });
  else if (change24h <= -25) out.push({ level: 'danger', text: `Volume ${change24h.toFixed(0)}% (24h) — cooling off fast` });

  // Surface dangers first, then warns, then good.
  const order: Record<Level, number> = { danger: 0, warn: 1, good: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]).slice(0, 5);
}

export default function Bubbles() {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Collection | null>(null);

  // Hydrate the initial selected collection (#1 by curated volume) on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const first = await fetchOpenSeaCollection(COLLECTIONS[0]);
      if (!cancelled) setSelected(first);
    })();
    return () => { cancelled = true; };
  }, []);

  // Filter curated by query
  const q = search.trim().toLowerCase();
  const localMatches = q
    ? COLLECTIONS.filter(c =>
        c.ticker.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q))
    : [];

  // OpenSea fallback search
  const [remote, setRemote] = useState<Collection | null>(null);
  const debounce = useRef<number | null>(null);
  useEffect(() => {
    setRemote(null);
    if (!q || localMatches.length > 0) { setSearching(false); return; }
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(async () => {
      setSearching(true);
      const result = await searchOpenSea(q);
      setRemote(result);
      setSearching(false);
    }, 450);
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
  }, [q, localMatches.length]);

  const suggestions: Collection[] = q
    ? (remote ? [remote, ...localMatches] : localMatches)
    : [];

  const pick = async (c: Collection) => {
    setSearch('');
    const live = await fetchOpenSeaCollection(c);
    setSelected(live);
  };

  const wallets = useMemo(
    () => selected ? generateBubbleMap(selected.slug, selected.supply, 36) : [],
    [selected?.slug, selected?.supply],
  );
  const risk = useMemo(
    () => selected ? riskScore(wallets, selected.supply) : { score: 0, label: '', color: '' },
    [wallets, selected?.supply],
  );
  const signals = useMemo(
    () => selected ? computeSignals(wallets, selected.supply, selected.change24h) : [],
    [wallets, selected?.supply, selected?.change24h],
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 12px 120px' }}>
      {/* Sticky search */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: '#000',
          margin: '0 -12px',
          padding: '12px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <SearchIcon
            size={16}
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.4)', pointerEvents: 'none',
            }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Trace any collection (slug or name)…"
            autoCapitalize="off" autoCorrect="off" spellCheck={false}
            style={{
              width: '100%', padding: '12px 40px 12px 40px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff', fontSize: 16,
              fontFamily: 'var(--font-mono), monospace', outline: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              }}
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {q && (
          <div
            style={{
              marginTop: 6,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              maxHeight: 240, overflowY: 'auto',
            }}
          >
            {searching && (
              <div style={{ padding: '12px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono), monospace', textAlign: 'center' }}>
                Searching OpenSea…
              </div>
            )}
            {!searching && suggestions.length === 0 && (
              <div style={{ padding: '12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono), monospace', textAlign: 'center' }}>
                No collection found
              </div>
            )}
            {suggestions.map(s => (
              <button
                key={s.slug}
                onClick={() => pick(s)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Thumb collection={s} size={36} radius={10} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
                    {s.ticker} · {s.slug}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <NetworkIcon size={20} className="text-sunset" />
            <span><span className="text-sunset">Bubble</span> Map</span>
          </h1>
          <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: 'var(--font-mono), monospace' }}>
            Trace wallet clusters · Spot scam patterns
          </div>
        </div>
      </div>

      {!selected && <Skeleton />}

      {selected && (
        <>
          {/* Selected collection + risk */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              marginBottom: 12,
            }}
          >
            <Thumb collection={selected} size={56} radius={14} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'var(--font-mono), monospace', marginTop: 2 }}>
                {selected.ticker} · {selected.supply.toLocaleString()} supply · {selected.owners.toLocaleString()} holders
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: risk.color, fontSize: 11, fontFamily: 'var(--font-mono), monospace', fontWeight: 800, letterSpacing: '0.1em' }}>
                <ShieldAlert size={12} /> {risk.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: risk.color, fontFamily: 'var(--font-mono), monospace', marginTop: 2, lineHeight: 1 }}>
                {risk.score}
              </div>
            </div>
          </div>

          {/* PLAIN-LANGUAGE SIGNALS — the quick read */}
          <div
            style={{
              display: 'grid', gap: 8,
              marginBottom: 12,
            }}
          >
            {signals.map((sig, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px',
                  borderRadius: 12,
                  background: `${LEVEL_COLOR[sig.level]}14`,
                  border: `1px solid ${LEVEL_COLOR[sig.level]}40`,
                }}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>
                  {sig.level === 'danger' ? '🔴' : sig.level === 'warn' ? '🟡' : '🟢'}
                </span>
                <span style={{ fontSize: 13, color: '#fff', lineHeight: 1.35 }}>
                  {sig.text}
                </span>
              </div>
            ))}
          </div>

          {/* BUBBLE MAP */}
          <BubbleCanvas wallets={wallets} supply={selected.supply} />

          {/* Cluster legend */}
          <div
            style={{
              display: 'flex', gap: 8, flexWrap: 'wrap',
              padding: '12px 0',
            }}
          >
            {[1, 2, 3].map(k => (
              <div key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: CLUSTER_COLORS[k] }} />
                {CLUSTER_NAMES[k]}
              </div>
            ))}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: CLUSTER_COLORS[0] }} />
              STANDALONE
            </div>
          </div>

          {/* Top holders table */}
          <div
            style={{
              marginTop: 16,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-mono), monospace',
              }}
            >
              Top Holders
            </div>
            {wallets.slice(0, 5).map((w, i) => (
              <div
                key={w.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr auto auto',
                  gap: 10, alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  fontSize: 12, fontFamily: 'var(--font-mono), monospace',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>#{i + 1}</span>
                <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: CLUSTER_COLORS[w.cluster] }} />
                  {shortAddr(w.address)}
                  <a
                    href={`https://etherscan.io/address/${w.address}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'rgba(255,255,255,0.35)', display: 'flex' }}
                  >
                    <ExternalLink size={10} />
                  </a>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{w.holdings.toLocaleString()}</span>
                <span style={{ color: '#fff', minWidth: 50, textAlign: 'right' }}>
                  {pct(w.holdings, selected.supply).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 12, padding: '10px 12px',
              fontSize: 10, color: 'rgba(255,255,255,0.45)',
              fontFamily: 'var(--font-mono), monospace',
              display: 'flex', gap: 6,
            }}
          >
            <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Cluster + holder data is synthesized for now. Wire NEXT_PUBLIC_OPENSEA_API_KEY on
              Vercel to pull real per-wallet holdings + transfer history.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function BubbleCanvas({ wallets, supply }: { wallets: Wallet[]; supply: number }) {
  const [tip, setTip] = useState<Wallet | null>(null);
  const W = 360;
  const H = 360;
  const layout = useMemo(() => layoutBubbles(wallets, W, H), [wallets]);

  // Find connection pairs (same cluster, both > 0)
  const lines: Array<{ i: number; j: number; color: string }> = [];
  for (let i = 0; i < wallets.length; i++) {
    if (wallets[i].cluster === 0) continue;
    for (let j = i + 1; j < wallets.length; j++) {
      if (wallets[j].cluster === wallets[i].cluster) {
        lines.push({ i, j, color: CLUSTER_COLORS[wallets[i].cluster] });
      }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%', aspectRatio: '1 / 1',
        background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.06) 0%, transparent 65%), #04020a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%" height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Cluster connection lines */}
        {lines.map((l, k) => (
          <line
            key={k}
            x1={layout[l.i]?.x} y1={layout[l.i]?.y}
            x2={layout[l.j]?.x} y2={layout[l.j]?.y}
            stroke={l.color} strokeOpacity={0.3} strokeWidth={1}
          />
        ))}

        {/* Bubbles */}
        {wallets.map((w, i) => {
          const p = layout[i];
          if (!p) return null;
          const color = CLUSTER_COLORS[w.cluster];
          return (
            <g
              key={w.id}
              onMouseEnter={() => setTip(w)}
              onMouseLeave={() => setTip(null)}
              onClick={() => setTip(tip?.id === w.id ? null : w)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={p.x} cy={p.y} r={p.r}
                fill={color} fillOpacity={0.4}
                stroke={color} strokeOpacity={0.95} strokeWidth={1.5}
              />
              {p.r > 18 && (
                <text
                  x={p.x} y={p.y + 4}
                  textAnchor="middle"
                  fontSize={10} fontWeight={800}
                  fontFamily="JetBrains Mono, monospace"
                  fill="#fff"
                  style={{ pointerEvents: 'none' }}
                >
                  {pct(w.holdings, supply).toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tip && (
        <div
          style={{
            position: 'absolute',
            left: 12, bottom: 12, right: 12,
            background: 'rgba(0,0,0,0.9)',
            border: `1px solid ${CLUSTER_COLORS[tip.cluster]}66`,
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono), monospace',
            color: '#fff',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setTip(null)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: CLUSTER_COLORS[tip.cluster] }} />
              {shortAddr(tip.address)}
            </span>
            <a
              href={`https://etherscan.io/address/${tip.address}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.6)', display: 'flex' }}
            >
              <ExternalLink size={12} />
            </a>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, color: 'rgba(255,255,255,0.7)' }}>
            <span>{tip.holdings.toLocaleString()} held</span>
            <span>·</span>
            <span>{pct(tip.holdings, supply).toFixed(2)}%</span>
            {tip.cluster > 0 && (
              <>
                <span>·</span>
                <span style={{ color: CLUSTER_COLORS[tip.cluster], fontWeight: 700 }}>
                  {CLUSTER_NAMES[tip.cluster]}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div style={{ height: 80, marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }} />
      <div style={{ aspectRatio: '1 / 1', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }} />
    </div>
  );
}
