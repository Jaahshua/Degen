'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { COLLECTIONS, searchOpenSea, type Collection } from '../data';
import type { View } from '../page';
import Thumb from './Thumb';
import TokenDetail from './TokenDetail';

const ETH_USD = 3000;

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function SearchOverlay({
  open, onClose, view, onTrace,
}: {
  open: boolean;
  onClose: () => void;
  view: View;
  onTrace: (c: Collection) => void;
}) {
  const [q, setQ] = useState('');
  const [extra, setExtra] = useState<Collection | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Collection | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<number | null>(null);

  // Focus + lock scroll when opened; reset when closed.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
    } else {
      document.body.style.overflow = '';
      setQ('');
      setExtra(null);
      setSelected(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const query = q.trim().toLowerCase();

  const localMatches = useMemo(() => {
    if (!query) return [...COLLECTIONS].sort((a, b) => b.volume24h - a.volume24h);
    return COLLECTIONS.filter(c =>
      c.ticker.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query));
  }, [query]);

  // OpenSea fallback when nothing local matches.
  useEffect(() => {
    setExtra(null);
    if (!query || localMatches.length > 0) { setSearching(false); return; }
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(async () => {
      setSearching(true);
      const result = await searchOpenSea(query);
      setExtra(result);
      setSearching(false);
    }, 450);
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
  }, [query, localMatches.length]);

  const results = useMemo(() => {
    if (!query) return localMatches;
    const list = [...localMatches];
    if (extra && !list.find(c => c.slug === extra.slug)) list.unshift(extra);
    return list;
  }, [localMatches, extra, query]);

  const tracing = view === 'bubbles';
  const handlePick = (c: Collection) => {
    if (tracing) onTrace(c);
    else setSelected(c);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: '#000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Search header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 12px',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <SearchIcon
            size={16}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}
          />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={tracing ? 'Trace any collection…' : 'Search any OpenSea collection…'}
            autoCapitalize="off" autoCorrect="off" spellCheck={false}
            style={{
              width: '100%', padding: '12px 40px 12px 40px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 16,
              fontFamily: 'var(--font-mono), monospace', outline: 'none',
            }}
          />
          {searching ? (
            <Loader2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)', animation: 'spin 1s linear infinite' }} />
          ) : q ? (
            <button onClick={() => setQ('')} aria-label="Clear"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          ) : null}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 4px',
            fontFamily: 'var(--font-mono), monospace',
          }}
        >
          Cancel
        </button>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {!query && (
          <div style={{ padding: '10px 2px', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono), monospace' }}>
            {tracing ? 'Tap to trace' : 'Trending'}
          </div>
        )}

        {query && !searching && results.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            No collection found
          </div>
        )}

        {results.map(c => (
          <button
            key={c.slug}
            onClick={() => handlePick(c)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Thumb collection={c} size={48} radius={12} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'var(--font-mono), monospace', marginTop: 2 }}>
                {c.ticker} · {c.slug}
              </div>
            </div>
            {c.floor > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{c.floor.toFixed(2)} Ξ</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'var(--font-mono), monospace', marginTop: 2 }}>
                  {fmtUsd(c.floor * c.supply * ETH_USD)}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {selected && <TokenDetail c={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
