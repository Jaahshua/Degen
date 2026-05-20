'use client';

import { useEffect, useState } from 'react';
import {
  Crosshair, Plus, X, Pause, Trash2, Search as SearchIcon, Zap,
  Wallet as WalletIcon, ShieldCheck, Info, Target, MousePointerClick, BellRing,
} from 'lucide-react';
import {
  readSnipers, writeSnipers, type Sniper as SniperT,
  type SniperSide, type SniperTrigger, TRIGGER_LABEL,
  COLLECTIONS, fetchOpenSeaCollection, searchOpenSea, type Collection,
} from '../data';

function triggerSummary(s: SniperT): string {
  switch (s.trigger) {
    case 'mint-live':     return 'When mint goes live';
    case 'floor-below':   return `Floor ≤ ${s.triggerValue ?? '?'} Ξ`;
    case 'underpriced':   return `Listing ${s.triggerValue ?? '?'}% under floor`;
    case 'take-profit':   return `Floor ≥ ${s.triggerValue ?? '?'} Ξ`;
    case 'stop-loss':     return `Floor ≤ ${s.triggerValue ?? '?'} Ξ`;
    case 'trailing-stop': return `Drops ${s.triggerValue ?? '?'}% from peak`;
    default:              return '';
  }
}

const BUY_TRIGGERS:  SniperTrigger[] = ['mint-live', 'floor-below', 'underpriced'];
const SELL_TRIGGERS: SniperTrigger[] = ['take-profit', 'stop-loss', 'trailing-stop'];

// triggers that need a numeric value, and whether that value is a % or Ξ
const TRIGGER_UNIT: Partial<Record<SniperTrigger, 'eth' | 'pct'>> = {
  'floor-below':   'eth',
  'underpriced':   'pct',
  'take-profit':   'eth',
  'stop-loss':     'eth',
  'trailing-stop': 'pct',
};
import Thumb from './Thumb';
import { useWalletGate } from '../hooks/useWalletGate';
import { toast } from './Toast';

export default function SniperView() {
  const [snipers, setSnipers] = useState<SniperT[]>([]);
  const [editing, setEditing] = useState<Partial<SniperT> | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const gate = useWalletGate();

  // Hydrate from localStorage
  useEffect(() => {
    setSnipers(readSnipers());
  }, []);

  const persist = (list: SniperT[]) => {
    setSnipers(list);
    writeSnipers(list);
  };

  // Simulated trigger loop: every 20s, pick one "watching" sniper at random
  // and probabilistically "trigger" it. Until we wire wallet + RPC this is
  // the closest we get without burning real gas.
  useEffect(() => {
    const id = setInterval(() => {
      const list = readSnipers();
      const watching = list.filter(s => s.status === 'watching');
      if (watching.length === 0) return;
      // ~25% chance per tick
      if (Math.random() > 0.25) return;
      const pick = watching[Math.floor(Math.random() * watching.length)];
      const updated = list.map(s =>
        s.id === pick.id
          ? { ...s, status: 'triggered' as const, triggeredAt: Date.now() }
          : s,
      );
      writeSnipers(updated);
      setSnipers(updated);
      toast(`🎯 Sniper hit · ${pick.side === 'sell' ? 'sold' : 'bought'} ${pick.quantity} ${pick.name}`);
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  const stop = (id: string) => {
    persist(snipers.map(s => s.id === id ? { ...s, status: 'stopped' } : s));
  };
  const resume = (id: string) => {
    persist(snipers.map(s => s.id === id ? { ...s, status: 'watching' } : s));
  };
  const remove = (id: string) => {
    persist(snipers.filter(s => s.id !== id));
  };

  const openNew = () => gate(() => setEditing({
    side: 'buy', quantity: 1, trigger: 'mint-live', gas: 'fast', network: 'ethereum',
  }));

  const save = (draft: SniperT) => {
    persist([draft, ...snipers]);
    setEditing(null);
    toast(`Sniper armed · watching ${draft.name}`);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 16px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(220,38,38,0.18) 0%, rgba(2,0,10,0) 80%)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(220,38,38,0.85)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace' }}>
            <Crosshair size={12} /> Sniper Bot
          </div>
          <button
            onClick={() => setInfoOpen(true)}
            aria-label="How it works"
            style={{
              width: 24, height: 24, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.75)', cursor: 'pointer', padding: 0,
            }}
          >
            <Info size={13} />
          </button>
        </div>
        <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Auto-mint &amp; snipe <span className="text-sunset">floors</span>
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          Set a target, a trigger, and a cap. The bot watches OpenSea + the mempool
          and fires the buy the instant your conditions are met. Your wallet signs
          when the snipe fires.
        </p>
        <button
          className="btn-blood"
          style={{ marginTop: 14, padding: '10px 18px', fontSize: 13 }}
          onClick={openNew}
        >
          <Plus size={13} /> <span>New sniper</span>
        </button>
      </div>

      {/* List */}
      {snipers.length === 0 ? (
        <div
          style={{
            padding: '40px 20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 16,
          }}
        >
          <Crosshair size={32} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: 10 }} />
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
            No snipers yet. Hit <strong style={{ color: '#fff' }}>New sniper</strong> to arm one.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {snipers.map(s => (
            <SniperCard
              key={s.id}
              s={s}
              onStop={() => stop(s.id)}
              onResume={() => resume(s.id)}
              onRemove={() => remove(s.id)}
            />
          ))}
        </div>
      )}

      {editing && (
        <SniperForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {infoOpen && <SniperInfo onClose={() => setInfoOpen(false)} />}
    </div>
  );
}

function SniperInfo({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: <Target size={16} />,             title: 'Pick a target', body: 'Choose any collection — from the list or by searching OpenSea.' },
    { icon: <MousePointerClick size={16} />,  title: 'Set the rule',   body: 'Fire when the mint goes live, or when the floor drops to a price you choose.' },
    { icon: <Zap size={16} />,                title: 'Set your cap',   body: 'Max price per item, how many to grab, and how fast (gas).' },
    { icon: <BellRing size={16} />,           title: 'It watches',     body: 'The bot watches OpenSea + the mempool 24/7. The moment your rule hits, it prepares the buy.' },
    { icon: <ShieldCheck size={16} />,        title: 'You approve',    body: 'Your wallet signs the final buy — nothing spends without your tap. Pause or delete a sniper any time.' },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 95,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          width: '100%', maxWidth: 400,
          background: '#0a0512',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: 18,
          maxHeight: '86vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={18} className="text-sunset" />
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em' }}>How sniping works</span>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ ...iconBtnStyle, width: 30, height: 30 }}>
            <X size={15} />
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          A sniper is a saved buy order that triggers itself. Set it once and it
          grabs the NFT the instant your conditions are met — so you don&apos;t have
          to sit there refreshing.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(220,38,38,0.15)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  color: '#fbbf24',
                }}
              >
                {s.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono), monospace', marginRight: 6 }}>{i + 1}</span>
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginTop: 2 }}>
                  {s.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16, padding: '10px 12px', borderRadius: 12,
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
            fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--up)', flexShrink: 0, marginTop: 1 }} />
          <span>Your keys stay in your wallet. The bot can never move funds without your signature.</span>
        </div>

        <button
          className="btn-blood"
          style={{ width: '100%', marginTop: 16, padding: '12px 0', fontSize: 14 }}
          onClick={onClose}
        >
          <span>Got it</span>
        </button>
      </div>
    </div>
  );
}

function SniperCard({
  s, onStop, onResume, onRemove,
}: {
  s: SniperT;
  onStop: () => void;
  onResume: () => void;
  onRemove: () => void;
}) {
  const statusMap = {
    watching:  { color: 'var(--up)',   pulse: true,  label: 'Watching' },
    triggered: { color: '#fbbf24',     pulse: false, label: 'Triggered' },
    stopped:   { color: 'rgba(255,255,255,0.4)', pulse: false, label: 'Stopped' },
    done:      { color: 'rgba(255,255,255,0.4)', pulse: false, label: 'Done' },
  };
  const stat = statusMap[s.status];

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: `hsl(${(s.slug.charCodeAt(0) * 23) % 360} 70% 45%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 14,
            flexShrink: 0,
          }}
        >
          {s.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{s.name}</span>
            <span
              style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '1px 6px', borderRadius: 5,
                background: s.side === 'sell' ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.18)',
                color: s.side === 'sell' ? 'var(--down)' : 'var(--up)',
                fontFamily: 'var(--font-mono), monospace',
              }}
            >
              {s.side}
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, color: stat.color, fontFamily: 'var(--font-mono), monospace',
                fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}
            >
              <span
                className={stat.pulse ? 'pulse-dot' : ''}
                style={{ width: 6, height: 6, borderRadius: 999, background: stat.color, display: 'inline-block' }}
              />
              {stat.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono), monospace', marginTop: 3 }}>
            {triggerSummary(s)}
            {' · '}
            {s.side === 'sell' ? 'sell' : 'buy'} {s.quantity} @ {s.side === 'sell' ? '≥' : '≤'} {s.maxPrice} Ξ
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.45)' }}>
        <span>
          gas: <strong style={{ color: '#fff' }}>{s.gas}</strong>{'  '}·{'  '}net: <strong style={{ color: '#fff' }}>{s.network}</strong>
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {s.status === 'watching' ? (
            <button onClick={onStop} title="Pause" style={iconBtnStyle}>
              <Pause size={13} />
            </button>
          ) : s.status === 'stopped' ? (
            <button onClick={onResume} title="Resume" style={iconBtnStyle}>
              <Zap size={13} />
            </button>
          ) : null}
          <button onClick={onRemove} title="Remove" style={{ ...iconBtnStyle, color: 'rgba(239,68,68,0.8)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: 'rgba(255,255,255,0.75)',
  cursor: 'pointer',
};

function SniperForm({
  initial, onCancel, onSave,
}: {
  initial: Partial<SniperT>;
  onCancel: () => void;
  onSave: (s: SniperT) => void;
}) {
  const [step, setStep] = useState<'target' | 'config'>('target');
  const [target, setTarget] = useState<Collection | null>(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Collection[]>([]);
  const [side, setSide] = useState<SniperSide>(initial.side ?? 'buy');
  const [trigger, setTrigger] = useState<SniperTrigger>(initial.trigger ?? 'mint-live');
  const [triggerValue, setTriggerValue] = useState<string>(initial.triggerValue?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState<string>(initial.maxPrice?.toString() ?? '');
  const [quantity, setQuantity] = useState<number>(initial.quantity ?? 1);
  const [gas, setGas] = useState<SniperT['gas']>(initial.gas ?? 'fast');
  const [network, setNetwork] = useState<SniperT['network']>(initial.network ?? 'ethereum');

  const triggerUnit = TRIGGER_UNIT[trigger];           // 'eth' | 'pct' | undefined
  const needsValue  = triggerUnit !== undefined;

  // When the side flips, snap the trigger to that side's default.
  const switchSide = (s: SniperSide) => {
    setSide(s);
    setTrigger(s === 'buy' ? 'mint-live' : 'take-profit');
    setTriggerValue('');
  };

  // Search results: curated + OpenSea fallback
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setSuggestions(COLLECTIONS.slice(0, 8));
      setSearching(false);
      return;
    }
    const local = COLLECTIONS.filter(c =>
      c.ticker.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q));
    setSuggestions(local);
    if (local.length === 0) {
      setSearching(true);
      const t = setTimeout(async () => {
        const r = await searchOpenSea(q);
        setSearching(false);
        if (r) setSuggestions([r]);
      }, 450);
      return () => clearTimeout(t);
    } else {
      setSearching(false);
    }
  }, [search]);

  const pickTarget = async (c: Collection) => {
    const live = await fetchOpenSeaCollection(c);
    setTarget(live);
    // Sensible defaults seeded off the live floor.
    if (needsValue && !triggerValue) {
      if (trigger === 'floor-below')        setTriggerValue((live.floor * 0.9).toFixed(2));
      else if (trigger === 'take-profit')   setTriggerValue((live.floor * 1.5).toFixed(2));
      else if (trigger === 'stop-loss')     setTriggerValue((live.floor * 0.7).toFixed(2));
      else if (trigger === 'underpriced')   setTriggerValue('10');
      else if (trigger === 'trailing-stop') setTriggerValue('15');
    }
    if (!maxPrice) {
      setMaxPrice((side === 'sell' ? live.floor * 0.98 : live.floor * 1.02).toFixed(2));
    }
    setStep('config');
  };

  const canSave =
    !!target &&
    parseFloat(maxPrice) > 0 &&
    (!needsValue || parseFloat(triggerValue) > 0) &&
    quantity > 0;

  const submit = () => {
    if (!target || !canSave) return;
    onSave({
      id: Date.now().toString(),
      slug: target.slug,
      name: target.name,
      side,
      trigger,
      triggerValue: needsValue ? parseFloat(triggerValue) : undefined,
      maxPrice: parseFloat(maxPrice),
      quantity,
      gas,
      network,
      createdAt: Date.now(),
      status: 'watching',
    });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="slide-up"
        style={{
          width: '100%', maxWidth: 480,
          background: '#05030a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px 20px 0 0',
          padding: '14px 14px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={16} className="text-sunset" />
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {step === 'target' ? 'Pick a target' : 'Configure sniper'}
            </span>
          </div>
          <button onClick={onCancel} aria-label="Close" style={{ ...iconBtnStyle, width: 30, height: 30 }}>
            <X size={14} />
          </button>
        </div>

        {step === 'target' && (
          <>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <SearchIcon size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}
              />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by slug or name…"
                autoCapitalize="off" autoCorrect="off" spellCheck={false}
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: 16,
                  fontFamily: 'var(--font-mono), monospace', outline: 'none',
                }}
              />
            </div>
            {searching && (
              <div style={{ padding: '8px', fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono), monospace' }}>
                Searching OpenSea…
              </div>
            )}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', marginTop: 4 }}>
              {suggestions.map(c => (
                <button
                  key={c.slug}
                  onClick={() => pickTarget(c)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 6px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Thumb collection={c} size={40} radius={10} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
                      {c.ticker} · {c.floor > 0 ? `${c.floor.toFixed(2)} Ξ floor` : 'no floor'}
                    </div>
                  </div>
                </button>
              ))}
              {!searching && suggestions.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  No matches.
                </div>
              )}
            </div>
          </>
        )}

        {step === 'config' && target && (
          <>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <Thumb collection={target} size={36} radius={10} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {target.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
                  Live floor {target.floor.toFixed(2)} Ξ
                </div>
              </div>
              <button onClick={() => setStep('target')} style={{ ...iconBtnStyle, padding: '4px 10px', width: 'auto', fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}>
                CHANGE
              </button>
            </div>

            {/* Side */}
            <Label>Side</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              <Toggle active={side === 'buy'}  onClick={() => switchSide('buy')}  label="Buy / Snipe" />
              <Toggle active={side === 'sell'} onClick={() => switchSide('sell')} label="Sell / Exit" />
            </div>

            {/* Trigger */}
            <Label>Trigger</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
              {(side === 'buy' ? BUY_TRIGGERS : SELL_TRIGGERS).map(t => (
                <Toggle key={t} active={trigger === t} onClick={() => { setTrigger(t); setTriggerValue(''); }} label={TRIGGER_LABEL[t]} />
              ))}
            </div>

            {needsValue && (
              <>
                <Label>{triggerUnit === 'pct' ? 'Threshold (%)' : 'Trigger floor (Ξ)'}</Label>
                <NumInput
                  value={triggerValue}
                  onChange={setTriggerValue}
                  placeholder={triggerUnit === 'pct' ? 'e.g. 15' : 'e.g. 39.50'}
                />
              </>
            )}

            <Label>{side === 'sell' ? 'Min accept per item (Ξ)' : 'Max price per item (Ξ)'}</Label>
            <NumInput value={maxPrice} onChange={setMaxPrice} placeholder="e.g. 42.00" />

            <Label>Quantity</Label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1, 2, 4, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setQuantity(n)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 999,
                    background: quantity === n ? 'rgba(34,197,94,0.5)' : 'rgba(16, 88, 50, 0.4)',
                    border: quantity === n ? '2px solid var(--up)' : '1px solid rgba(34,197,94,0.4)',
                    color: quantity === n ? '#fff' : 'var(--up)',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-mono), monospace',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <Label>Gas priority</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
              {(['standard', 'fast', 'instant'] as const).map(g => (
                <Toggle key={g} active={gas === g} onClick={() => setGas(g)} label={g.toUpperCase()} />
              ))}
            </div>

            <Label>Network</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {(['ethereum', 'base'] as const).map(n => (
                <Toggle key={n} active={network === n} onClick={() => setNetwork(n)} label={n.toUpperCase()} />
              ))}
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 12,
                fontSize: 11, color: 'rgba(255,255,255,0.7)',
                display: 'flex', gap: 8, alignItems: 'flex-start',
                marginBottom: 14,
              }}
            >
              <ShieldCheck size={14} style={{ color: 'var(--up)', flexShrink: 0, marginTop: 1 }} />
              <span>
                When triggered, your wallet signs the {side === 'sell' ? 'sale' : 'buy'}.
                Nothing executes without your approval.
              </span>
            </div>

            <button
              className="btn-blood"
              disabled={!canSave}
              onClick={submit}
              style={{
                width: '100%', padding: '14px 0', fontSize: 14,
                opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed',
              }}
            >
              <span>Arm {side === 'sell' ? 'Sell' : 'Buy'} Sniper</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10, color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.16em',
        fontFamily: 'var(--font-mono), monospace',
        marginBottom: 6, marginTop: 2,
      }}
    >
      {children}
    </div>
  );
}

function Toggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 6px',
        borderRadius: 10,
        background: active ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid var(--up)' : '1px solid rgba(255,255,255,0.08)',
        color: active ? 'var(--up)' : 'rgba(255,255,255,0.7)',
        fontSize: 11, fontWeight: 700,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono), monospace',
      }}
    >
      {label}
    </button>
  );
}

function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontSize: 16,
        fontFamily: 'var(--font-mono), monospace', outline: 'none',
        marginBottom: 12,
      }}
    />
  );
}
